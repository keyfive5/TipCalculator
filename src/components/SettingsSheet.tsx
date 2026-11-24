import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { ReactNode, useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHaptics } from '../haptics';
import { CURRENCIES, currencyFractionDigits, formatMinor } from '../money';
import { Appearance, DEFAULT_SETTINGS, useSettings } from '../settings';
import { fonts, useTheme } from '../theme';
import { PressableScale } from './PressableScale';
import { Stepper } from './Stepper';

// iOS keeps its native white thumb; web/Android default to a teal thumb otherwise.
const switchThumb = (
  Platform.OS === 'ios' ? {} : { thumbColor: '#FFFFFF', activeThumbColor: '#FFFFFF' }
) as object;

export const PRIVACY_URL = 'https://github.com/keyfive5/TipCalculator/blob/main/PRIVACY.md';

type Props = { visible: boolean; onClose: () => void };

export function SettingsSheet({ visible, onClose }: Props) {
  const t = useTheme();
  const h = useHaptics();
  const insets = useSafeAreaInsets();
  const { settings, update, money, deviceCurrency } = useSettings();
  const [page, setPage] = useState<'main' | 'currency'>('main');
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const sheet = Platform.OS === 'ios';

  const close = () => {
    onClose();
    setTimeout(() => setPage('main'), 300);
  };

  const sample = (code: string) =>
    formatMinor(123450 * 10 ** (currencyFractionDigits(code) - 2), {
      locale: money.locale,
      currency: code,
      fractionDigits: currencyFractionDigits(code),
    });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={sheet ? 'pageSheet' : 'fullScreen'}
      onRequestClose={close}
    >
      <View style={[styles.root, { backgroundColor: t.bg, paddingTop: sheet ? 0 : insets.top }]}>
        <View style={[styles.header, { borderBottomColor: t.line }]}>
          {page === 'currency' ? (
            <Pressable accessibilityRole="button" onPress={() => setPage('main')} hitSlop={10} style={styles.back}>
              <Ionicons name="chevron-back" size={22} color={t.accentText} />
              <Text style={[styles.headerBtn, { color: t.accentText }]}>Settings</Text>
            </Pressable>
          ) : (
            <View style={styles.back} />
          )}
          <Text style={[styles.title, { color: t.text }]}>{page === 'currency' ? 'Currency' : 'Settings'}</Text>
          <Pressable accessibilityRole="button" onPress={close} hitSlop={10} style={styles.done}>
            <Text style={[styles.headerBtn, { color: t.accentText, fontFamily: fonts.bodySemi }]}>Done</Text>
          </Pressable>
        </View>

        {page === 'currency' ? (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
            <Group>
              <CurrencyRow
                title={`Automatic`}
                subtitle={`Follows your region · ${deviceCurrency}`}
                sample={sample(deviceCurrency)}
                selected={settings.currency === 'auto'}
                onPress={() => {
                  h.tick();
                  update({ currency: 'auto' });
                }}
              />
            </Group>
            <View style={{ height: 16 }} />
            <Group>
              {CURRENCIES.map((c, i) => (
                <CurrencyRow
                  key={c.code}
                  title={c.code}
                  subtitle={c.name}
                  sample={sample(c.code)}
                  selected={settings.currency === c.code}
                  last={i === CURRENCIES.length - 1}
                  onPress={() => {
                    h.tick();
                    update({ currency: c.code });
                  }}
                />
              ))}
            </Group>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
            <SectionLabel>MONEY</SectionLabel>
            <Group>
              <Row
                title="Currency"
                onPress={() => setPage('currency')}
                right={
                  <View style={styles.rowRight}>
                    <Text style={[styles.rowValue, { color: t.textDim }]}>
                      {settings.currency === 'auto' ? `Auto · ${money.currency}` : money.currency}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={t.textFaint} />
                  </View>
                }
              />
              <Row
                title="Tip before tax"
                subtitle="Enter the receipt total; Tipwise removes the tax before tipping."
                right={
                  <Switch
                    value={settings.excludeTax}
                    onValueChange={(v) => {
                      h.tick();
                      update({ excludeTax: v });
                    }}
                    trackColor={{ true: t.accent, false: t.surfaceHi }}
                    {...switchThumb}
                    ios_backgroundColor={t.surfaceHi}
                  />
                }
                last={!settings.excludeTax}
              />
              {settings.excludeTax && (
                <Row
                  title="Sales tax rate"
                  last
                  right={
                    <Stepper
                      size="sm"
                      label="Sales tax rate"
                      value={settings.taxRate}
                      min={0}
                      max={30}
                      step={0.25}
                      format={(v) => `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2).replace(/0$/, '')}%`}
                      onChange={(v) => update({ taxRate: v })}
                    />
                  }
                />
              )}
            </Group>

            <SectionLabel>QUICK TIPS</SectionLabel>
            <Group>
              {settings.presets.map((p, i) => (
                <Row
                  key={i}
                  title={`Button ${i + 1}`}
                  last={i === settings.presets.length - 1}
                  right={
                    <Stepper
                      size="sm"
                      label={`Quick tip ${i + 1}`}
                      value={p}
                      min={0}
                      max={50}
                      format={(v) => `${v}%`}
                      onChange={(v) => {
                        const next = [...settings.presets];
                        next[i] = v;
                        update({ presets: next });
                      }}
                    />
                  }
                />
              ))}
            </Group>

            <SectionLabel>FEEL</SectionLabel>
            <Group>
              <Row
                title="Haptics"
                subtitle="A gentle tap on every key."
                right={
                  <Switch
                    value={settings.haptics}
                    onValueChange={(v) => update({ haptics: v })}
                    {...switchThumb}
                    trackColor={{ true: t.accent, false: t.surfaceHi }}
                    ios_backgroundColor={t.surfaceHi}
                  />
                }
              />
              <Row
                title="Appearance"
                last
                right={
                  <Segmented
                    value={settings.appearance}
                    options={[
                      ['system', 'Auto'],
                      ['light', 'Light'],
                      ['dark', 'Dark'],
                    ]}
                    onChange={(v) => {
                      h.tick();
                      update({ appearance: v });
                    }}
                  />
                }
              />
            </Group>

            <SectionLabel>ABOUT</SectionLabel>
            <Group>
              <Row
                title="Privacy policy"
                onPress={() => Linking.openURL(PRIVACY_URL)}
                right={<Ionicons name="open-outline" size={18} color={t.textFaint} />}
              />
              <Row
                title="Reset to defaults"
                last
                onPress={() => {
                  h.warn();
                  update({ ...DEFAULT_SETTINGS });
                }}
                titleColor={t.danger}
              />
            </Group>

            <View style={styles.footer}>
              <Text style={[styles.wordmark, { color: t.text }]}>
                Tip<Text style={{ fontFamily: fonts.displayItalic, color: t.accentText }}>wise</Text>
              </Text>
              <Text style={[styles.footerText, { color: t.textFaint }]}>
                Version {version}
                {'\n'}No ads. No tracking. No account.{'\n'}Your numbers never leave this phone.
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={[styles.section, { color: t.textDim }]}>{children}</Text>;
}

function Group({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <View style={[styles.group, { backgroundColor: t.surface, borderColor: t.line }]}>{children}</View>;
}

function Row({
  title,
  subtitle,
  right,
  onPress,
  last,
  titleColor,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
  titleColor?: string;
}) {
  const t = useTheme();
  const content = (
    <View style={[styles.row, !last && { borderBottomColor: t.line, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: titleColor ?? t.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.rowSub, { color: t.textDim }]}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && { backgroundColor: t.surfacePressed }}>
      {content}
    </Pressable>
  );
}

function CurrencyRow({
  title,
  subtitle,
  sample,
  selected,
  onPress,
  last,
}: {
  title: string;
  subtitle: string;
  sample: string;
  selected: boolean;
  onPress: () => void;
  last?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}, ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => pressed && { backgroundColor: t.surfacePressed }}
    >
      <View style={[styles.row, !last && { borderBottomColor: t.line, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: t.text }]}>{title}</Text>
          <Text style={[styles.rowSub, { color: t.textDim }]}>{subtitle}</Text>
        </View>
        <Text style={[styles.sample, { color: t.textFaint }]}>{sample}</Text>
        <View style={{ width: 26, alignItems: 'flex-end' }}>
          {selected && <Ionicons name="checkmark" size={20} color={t.accentText} />}
        </View>
      </View>
    </Pressable>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: Appearance;
  options: [Appearance, string][];
  onChange: (v: Appearance) => void;
}) {
  const t = useTheme();
  return (
    <View style={[styles.seg, { backgroundColor: t.surfaceHi }]}>
      {options.map(([v, label]) => {
        const on = v === value;
        return (
          <PressableScale
            key={v}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(v)}
            style={[styles.segItem, on && { backgroundColor: t.accent }]}
          >
            <Text style={[styles.segText, { color: on ? t.accentInk : t.textDim }]}>{label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { flexDirection: 'row', alignItems: 'center', width: 96 },
  done: { width: 96, alignItems: 'flex-end', paddingRight: 4 },
  headerBtn: { fontFamily: fonts.bodyMedium, fontSize: 16 },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.bodySemi, fontSize: 17 },
  section: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.6, marginTop: 22, marginBottom: 8, marginLeft: 4 },
  group: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 54, paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: fonts.bodyMedium, fontSize: 16 },
  rowSub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { fontFamily: fonts.body, fontSize: 15 },
  sample: { fontFamily: fonts.body, fontSize: 14 },
  seg: { flexDirection: 'row', borderRadius: 11, padding: 3 },
  segItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9 },
  segText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  footer: { alignItems: 'center', marginTop: 36, gap: 8 },
  wordmark: { fontFamily: fonts.display, fontSize: 26 },
  footerText: { fontFamily: fonts.body, fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
