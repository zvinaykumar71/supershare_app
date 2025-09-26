import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

type Slide = {
  title: string;
  description: string;
  image: any;
  cta: string;
};

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const slides: Slide[] = useMemo(
    () => [
      {
        title: 'Anywhere you are',
        description:
          'Book or share rides seamlessly. We keep things simple so you can move fast.',
        image: require('../assets/images/Frame_2.svg'),
        cta: 'Next',
      },
      {
        title: 'At anytime',
        description:
          'Reliable options around the clock with upfront pricing and trusted drivers.',
        image: require('../assets/images/Frame_3.svg'),
        cta: 'Next',
      },
      {
        title: 'Book your car',
        description:
          'Pick a ride and go. It is that easy to get where you need to be.',
        image: require('../assets/images/Frame_1.svg'),
        cta: 'Go',
      },
    ],
    []
  );

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/');
  };

  const handleNext = async () => {
    if (index < slides.length - 1) {
      const nextIndex = index + 1;
      setIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      return;
    }
    await handleSkip();
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(x / width);
    if (newIndex !== index) setIndex(newIndex);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Pressable onPress={handleSkip} style={{ position: 'absolute', right: 24, top: 18, zIndex: 10 }}>
        <Text style={{ color: '#8E8E93', fontSize: 16 }}>Skip</Text>
      </Pressable>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ alignItems: 'stretch' }}
      >
        {slides.map((slide, idx) => (
          <View key={slide.title} style={{ width, paddingHorizontal: 24, justifyContent: 'center' }}>
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Image
                source={slide.image}
                style={{ width: width * 0.8, height: width * 0.5, resizeMode: 'contain' }}
              />
            </View>
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <Text style={{ fontSize: 22, fontWeight: '600', color: '#111' }}>{slide.title}</Text>
              <Text
                style={{
                  textAlign: 'center',
                  color: '#6B7280',
                  marginTop: 10,
                  lineHeight: 20,
                }}
              >
                {slide.description}
              </Text>
            </View>

            <View style={{ alignItems: 'center', marginTop: 32 }}>
              <Pressable
                onPress={handleNext}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: '#10B981',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                }}
                accessibilityRole="button"
                accessibilityLabel={slide.cta}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>{idx === slides.length - 1 ? 'Go' : '→'}</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 8 as any }}>
              {slides.map((_, dotIdx) => (
                <View
                  key={dotIdx}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: dotIdx === index ? '#10B981' : '#D1D5DB',
                    marginHorizontal: 4,
                  }}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}


