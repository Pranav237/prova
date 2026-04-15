import { useState, useEffect, useRef, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import MessageBubble from '@/components/conversation/MessageBubble';
import TypingIndicator from '@/components/conversation/TypingIndicator';
import ChatInput from '@/components/conversation/ChatInput';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { processMessage as processMessageApi } from '@/lib/api';
import { addMessage, subscribeToMessages, updateSession } from '@/lib/firestore';
import { colors, typography } from '@/constants/theme';
import type { Message } from '@/lib/types';

const ConversationScreen = () => {
  const router = useRouter();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const sessionId = useSessionStore((s) => s.sessionId);
  const intent = useSessionStore((s) => s.intent);
  const messages = useSessionStore((s) => s.messages);
  const setMessages = useSessionStore((s) => s.setMessages);
  const isProvaTyping = useSessionStore((s) => s.isProvaTyping);
  const setIsProvaTyping = useSessionStore((s) => s.setIsProvaTyping);
  const isClosing = useSessionStore((s) => s.isClosing);
  const setIsClosing = useSessionStore((s) => s.setIsClosing);

  const flatListRef = useRef<FlatList>(null);
  const [inputDisabled, setInputDisabled] = useState(false);
  const greetingSentRef = useRef(false);

  useEffect(() => {
    if (!firebaseUser || !sessionId) return;

    const unsubscribe = subscribeToMessages(
      firebaseUser.uid,
      sessionId,
      (msgs) => setMessages(msgs)
    );

    return unsubscribe;
  }, [firebaseUser, sessionId, setMessages]);

  useEffect(() => {
    if (!firebaseUser || !sessionId || greetingSentRef.current) return;
    if (messages.length > 0) return;

    greetingSentRef.current = true;

    const generateOpening = async () => {
      setIsProvaTyping(true);
      try {
        const result = await processMessageApi({
          userId: firebaseUser.uid,
          sessionId,
          isSessionStart: true,
        });

        await addMessage(firebaseUser.uid, sessionId, {
          role: 'prova',
          content: result.data.response,
          meta: result.data.meta,
        });
      } catch (e) {
        console.error('Failed to generate opening:', e);
        await addMessage(firebaseUser.uid, sessionId, {
          role: 'prova',
          content: "Let's begin. What's something you believe strongly that you've never fully examined?",
        });
      } finally {
        setIsProvaTyping(false);
      }
    };
    generateOpening();
  }, [firebaseUser, sessionId, messages.length, intent, setIsProvaTyping]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleEndSession = useCallback(() => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end this session? Your progress will not be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: async () => {
            if (!firebaseUser || !sessionId) return;
            try {
              await updateSession(firebaseUser.uid, sessionId, { status: 'incomplete' } as any);
            } catch (e) {
              console.error('Failed to update session status:', e);
            }
            useSessionStore.getState().reset();
            router.replace('/(app)/(session)');
          },
        },
      ]
    );
  }, [firebaseUser, sessionId, router]);

  const handleSend = useCallback(async (text: string) => {
    if (!firebaseUser || !sessionId || isClosing) return;

    setIsProvaTyping(true);
    setInputDisabled(true);

    try {
      await addMessage(firebaseUser.uid, sessionId, {
        role: 'user',
        content: text,
      });

      const result = await processMessageApi({
        userId: firebaseUser.uid,
        sessionId,
        userMessage: text,
      });

      const { response, meta } = result.data;

      await addMessage(firebaseUser.uid, sessionId, {
        role: 'prova',
        content: response,
        meta,
      });

      if (meta.isClosingMessage) {
        setIsClosing(true);
        setInputDisabled(true);
        setTimeout(() => {
          router.push('/(app)/(session)/ending');
        }, 2000);
        return;
      }
    } catch (e) {
      console.error('Failed to process message:', e);
    } finally {
      setIsProvaTyping(false);
      if (!isClosing) setInputDisabled(false);
    }
  }, [firebaseUser, sessionId, isClosing, setIsProvaTyping, setIsClosing, router]);

  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <MessageBubble content={item.content} role={item.role} />
  ), []);

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Session</Text>
        <TouchableOpacity onPress={handleEndSession} hitSlop={8}>
          <X size={18} color={colors.text.muted} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Starting your session...
            </Text>
          </View>
        }
        ListFooterComponent={isProvaTyping ? <TypingIndicator /> : null}
      />

      <ChatInput onSend={handleSend} disabled={inputDisabled} />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 15,
    color: colors.white,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    ...typography.body.default,
    color: colors.text.muted,
  },
});

export default ConversationScreen;
