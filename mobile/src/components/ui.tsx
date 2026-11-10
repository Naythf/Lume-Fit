import type { ReactNode } from 'react';
import { Pressable, Text, View, ScrollView, TextInput, KeyboardAvoidingView, Platform, type TextProps, type TextInputProps, type ViewStyle, type StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, typography } from '@/theme';

export function Copy({ variant = 'body', muted, style, ...props }: TextProps & { variant?: keyof typeof typography; muted?: boolean }) {
  return <Text {...props} style={[typography[variant], { color: muted ? colors.muted : colors.text }, style]} />;
}
export function Button({ title, onPress, secondary, disabled, style }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: !!disabled }} onPress={onPress} disabled={disabled}
    style={({ pressed }) => [{ minHeight: 52, padding: space.lg, borderRadius: radius.md, borderCurve: 'continuous', backgroundColor: secondary ? colors.raised : colors.text,
      alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }, style]}>
    <Copy variant="heading" style={{ color: secondary ? colors.text : colors.ink, textAlign: 'center' }}>{title}</Copy>
  </Pressable>;
}
export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ padding: space.xl, gap: space.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, borderCurve: 'continuous' }, style]}>{children}</View>;
}
export function Page({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ flexGrow: 1, width: '100%', maxWidth: 660, alignSelf: 'center', padding: space.xl, paddingBottom: space.xxl + insets.bottom, gap: space.xl }}>{children}</ScrollView>
  </KeyboardAvoidingView>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: space.sm, flexGrow: 1 }}><Copy variant="caption" muted>{label}</Copy>
    <TextInput {...props} accessibilityLabel={label} placeholderTextColor={colors.subtle} selectionColor={colors.text}
      style={[{ color: colors.text, backgroundColor: colors.surface, minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: space.md, fontSize: typography.body.fontSize }, props.style]} />
  </View>;
}
export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return <Panel><Copy variant="heading">{title}</Copy><Copy muted>{children}</Copy></Panel>;
}
