import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import colors from '../constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BottomSheet = ({ isOpen, onClose, children, maxHeight = SCREEN_HEIGHT * 0.85 }) => {
  const [visible, setVisible] = useState(isOpen);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const initialDy = useRef(0);

  // Track if sheet is currently animating to close
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      isClosingRef.current = false;
      
      // Animate opening
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 8.5,
        }),
      ]).start();
    } else {
      if (visible && !isClosingRef.current) {
        animateClose();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const animateClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Capture downward swipes as early as possible (dy > 2) to beat the ScrollView's native gesture lock
        return gestureState.dy > 2 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.5;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 2 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: (_, gestureState) => {
        translateY.extractOffset();
        initialDy.current = gestureState.dy;
      },
      onPanResponderMove: (_, gestureState) => {
        const delta = gestureState.dy - initialDy.current;
        translateY.setValue(Math.max(0, delta));
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const delta = gestureState.dy - initialDy.current;
        if (delta > 100 || gestureState.vy > 0.5) {
          animateClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 9,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        // If a ScrollView or other component steals the touch, bounce back smoothly
        translateY.flattenOffset();
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 9,
        }).start();
      }
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={animateClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={animateClose}>
          <Animated.View 
            style={[
              styles.backdrop, 
              { opacity: backdropOpacity }
            ]} 
          />
        </TouchableWithoutFeedback>

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.sheetContainer,
            { 
              transform: [{ translateY }],
              maxHeight: maxHeight
            }
          ]}
        >
          {/* Gesture Drag Handle Area */}
          <View style={styles.dragHeader}>
            <View style={styles.dragHandle} />
          </View>

          {/* Children View */}
          <View style={styles.content}>
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    width: '100%',
  },
  dragHeader: {
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flexShrink: 1,
  },
});

export default BottomSheet;
