import React, { ReactNode, useCallback, useEffect } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useThemeColors } from "../context/ThemeContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Easing,
  Extrapolation,
} from "react-native-reanimated";
import { useRouter, usePathname } from "expo-router";

const TAB_ROUTES = ["/(tabs)/home", "/(tabs)/clientes", "/(tabs)/produtos"];
const TAB_INFO: { label: string; icon: string }[] = [
  { label: "Início", icon: "home" },
  { label: "Clientes", icon: "people" },
  { label: "Produtos", icon: "cube" },
];

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 500;

interface SwipeableTabViewProps {
  children: ReactNode;
}

export function SwipeableTabView({ children }: SwipeableTabViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useThemeColors();

  const translateX = useSharedValue(0);

  // Reset position when the screen changes (after navigation completes)
  useEffect(() => {
    translateX.value = 0;
  }, [pathname]);

  const currentIndex = TAB_ROUTES.findIndex((route) => {
    const tabPath = route.replace("/(tabs)", "");
    return pathname === tabPath || pathname.startsWith(tabPath + "/");
  });

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < TAB_ROUTES.length - 1;
  const prevTab = hasPrev ? TAB_INFO[currentIndex - 1] : null;
  const nextTab = hasNext ? TAB_INFO[currentIndex + 1] : null;

  const navigateToTab = useCallback(
    (index: number) => {
      router.replace(TAB_ROUTES[index] as any);
    },
    [router],
  );

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      "worklet";
      const { translationX: tx } = event;

      const atStart = !hasPrev && tx > 0;
      const atEnd = !hasNext && tx < 0;

      if (atStart || atEnd) {
        // Rubber-band at boundaries
        translateX.value = tx * 0.12;
      } else {
        // Allow full screen-width drag
        translateX.value = Math.max(-SCREEN_WIDTH, Math.min(SCREEN_WIDTH, tx));
      }
    })
    .onEnd((event) => {
      "worklet";
      const { translationX: tx, velocityX } = event;

      const isSwipe =
        Math.abs(tx) > SWIPE_THRESHOLD ||
        Math.abs(velocityX) > VELOCITY_THRESHOLD;

      if (isSwipe) {
        if (tx > 0 && hasPrev) {
          translateX.value = withTiming(
            SCREEN_WIDTH,
            { duration: 200, easing: Easing.out(Easing.ease) },
            () => {
              runOnJS(navigateToTab)(currentIndex - 1);
            },
          );
        } else if (tx < 0 && hasNext) {
          translateX.value = withTiming(
            -SCREEN_WIDTH,
            { duration: 200, easing: Easing.out(Easing.ease) },
            () => {
              runOnJS(navigateToTab)(currentIndex + 1);
            },
          );
        } else {
          translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        }
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  // Current screen follows the finger
  const currentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Previous tab preview — slides in from behind on the left
  const leftPreviewStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SCREEN_WIDTH * 0.15],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  // Next tab preview — slides in from behind on the right
  const rightPreviewStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SCREEN_WIDTH * 0.15, 0],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={styles.container}>
        {/* Previous tab preview (behind current screen) */}
        {prevTab && (
          <Animated.View style={[styles.previewPanel, leftPreviewStyle]}>
            <LinearGradient
              colors={[...colors.gradientPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewGradient}
            >
              <Ionicons
                name={prevTab.icon as any}
                size={40}
                color="rgba(255,255,255,0.85)"
              />
              <Text style={styles.previewLabel}>{prevTab.label}</Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Next tab preview (behind current screen) */}
        {nextTab && (
          <Animated.View style={[styles.previewPanel, rightPreviewStyle]}>
            <LinearGradient
              colors={[...colors.gradientPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewGradient}
            >
              <Ionicons
                name={nextTab.icon as any}
                size={40}
                color="rgba(255,255,255,0.85)"
              />
              <Text style={styles.previewLabel}>{nextTab.label}</Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Current screen — sits on top */}
        <Animated.View style={[styles.currentScreen, currentStyle]}>
          {children}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  previewPanel: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  previewGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  previewLabel: {
    fontSize: 22,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.5,
  },
  currentScreen: {
    flex: 1,
    zIndex: 2,
  },
});
