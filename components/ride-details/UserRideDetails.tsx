import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/Constants/Colors';
import { useUserBookings, usePassengerBookingRequests, useCancelBooking } from '@/hooks/useBookings';

import { PassengerBookingCard } from '@/components/shared/PassengerBookingCard';

export const UserRideDetails = ({ user }: { user: any }) => {
    const router = useRouter();

    // Data fetching
    const {
        data: bookingsData,
        isLoading: isLoadingBooked,
        refetch: refetchBooked,
        isRefetching: isRefetchingBooked
    } = useUserBookings();

    const {
        data: passengerRequestsData,
        isLoading: isLoadingPassengerRequests,
        refetch: refetchPassengerRequests,
        isRefetching: isRefetchingPassengerRequests
    } = usePassengerBookingRequests();

    // For driver requests (if user is checking requests tab from driver perspective but in user mode context - rare but possible if tabs are mixed)
    // Actually, wait, "Requests" for user means "My requests to join a ride" usually?
    // Let's check original code. 
    // Original code had `passengerRequests` for user.
    // Original code also had `currentRideRequests` (driver receiving requests).
    // If this is UserRideDetails, it should focus on User as Passenger.
    // HOWEVER, the original code mixed them if `!showDriverFeatures`.
    // If `showDriverFeatures` is false, it showed `activeRides`, `passengerRequests`, `history`.
    // Wait, `passengerRequests` in original code are requests MADE BY THE USER (as passenger).
    // `currentRideRequests` are requests RECEIVED BY THE DRIVER.

    // Confirmed from original code:
    // `const passengerRequests = useMemo(() => allPassengerRequests.filter((b: any) => b.status === 'pending'), ...)` -> Requests I made.

    const allPassengerBookings = useMemo(() => bookingsData?.asPassenger || [], [bookingsData]);

    // Confirmed rides logic
    const confirmedRides = useMemo(() => allPassengerBookings.filter((b: any) => {
        const bookingStatus = b.status === 'confirmed' || b.status === 'accepted';
        const rideStatus = b.ride?.rideStatus || b.rideStatus;
        return bookingStatus && rideStatus !== 'completed' && rideStatus !== 'COMPLETED' &&
            rideStatus !== 'cancelled' && rideStatus !== 'CANCELLED';
    }), [allPassengerBookings]);

    // Requests logic
    const allPassengerRequests = useMemo(() => passengerRequestsData?.bookingRequests || [], [passengerRequestsData]);
    const passengerRequests = useMemo(() =>
        allPassengerRequests.filter((b: any) => b.status === 'pending'),
        [allPassengerRequests]
    );

    // Accepted from requests logic
    const acceptedFromRequests = useMemo(() =>
        allPassengerRequests.filter((b: any) => {
            const bookingStatus = b.status === 'confirmed' || b.status === 'accepted';
            const rideStatus = b.ride?.rideStatus || b.rideStatus;
            return bookingStatus && rideStatus !== 'completed' && rideStatus !== 'COMPLETED' &&
                rideStatus !== 'cancelled' && rideStatus !== 'CANCELLED';
        }),
        [allPassengerRequests]
    );

    // Combine confirmed rides
    const allActiveRides = useMemo(() => {
        const rideIds = new Set(confirmedRides.map((r: any) => r.id || r._id));
        const additionalRides = acceptedFromRequests.filter((r: any) => !rideIds.has(r.id || r._id));
        return [...confirmedRides, ...additionalRides];
    }, [confirmedRides, acceptedFromRequests]);

    // Completed rides logic (history)
    const completedPassengerRides = useMemo(() => {
        return allPassengerBookings.filter((b: any) => {
            const rideStatus = b.ride?.rideStatus || b.ride?.status || b.rideStatus || b.status;
            const bookingStatus = b.status;
            return (bookingStatus === 'confirmed' || bookingStatus === 'accepted') &&
                (rideStatus === 'completed' || rideStatus === 'COMPLETED');
        });
    }, [allPassengerBookings]);

    const completedFromRequests = useMemo(() => {
        return allPassengerRequests.filter((b: any) => {
            const bookingStatus = b.status === 'confirmed' || b.status === 'accepted';
            const rideStatus = b.ride?.rideStatus || b.ride?.status || b.rideStatus;
            return bookingStatus && (rideStatus === 'completed' || rideStatus === 'COMPLETED');
        });
    }, [allPassengerRequests]);

    const allCompletedPassengerRides = useMemo(() => {
        const rideIds = new Set(completedPassengerRides.map((r: any) => r.id || r._id));
        const additionalRides = completedFromRequests.filter((r: any) => !rideIds.has(r.id || r._id));
        return [...completedPassengerRides, ...additionalRides];
    }, [completedPassengerRides, completedFromRequests]);

    // Check for ride in progress
    const hasRideInProgress = useMemo(() => {
        return allActiveRides.some((b: any) => b.ride?.rideStatus === 'in_progress');
    }, [allActiveRides]);

    // Tab state
    const [activeTab, setActiveTab] = useState<'activeRides' | 'passengerRequests' | 'history'>('activeRides');
    const [refreshing, setRefreshing] = useState(false);

    // Polling
    const pollingIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (activeTab === 'activeRides' && hasRideInProgress) {
            pollingIntervalRef.current = setInterval(() => {
                refetchBooked();
                refetchPassengerRequests();
            }, 10000);
        }

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [activeTab, hasRideInProgress, refetchBooked, refetchPassengerRequests]);

    // Actions
    const { mutate: cancelBooking } = useCancelBooking();

    const handleCancelBooking = (id: string) => {
        Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this booking?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => {
                        (cancelBooking as unknown as (id: string, options?: any) => void)(id, {
                            onSuccess: () => {
                                refetchBooked();
                                refetchPassengerRequests();
                            },
                            onError: (error: any) => {
                                Alert.alert('Error', error.response?.data?.message || 'Failed to cancel booking');
                            }
                        });
                    }
                }
            ]
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([refetchBooked(), refetchPassengerRequests()]);
        } finally {
            setRefreshing(false);
        }
    };

    const isLoading = isLoadingBooked || isLoadingPassengerRequests;
    const isRefetching = isRefetchingBooked || isRefetchingPassengerRequests;

    return (
        <View style={styles.container}>
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    onPress={() => setActiveTab('activeRides')}
                    style={[styles.tabButton, activeTab === 'activeRides' && styles.tabButtonActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'activeRides' && styles.tabTextActive]}>Active</Text>
                    {allActiveRides.length > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{allActiveRides.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab('passengerRequests')}
                    style={[styles.tabButton, activeTab === 'passengerRequests' && styles.tabButtonActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'passengerRequests' && styles.tabTextActive]}>Requests</Text>
                    {passengerRequests.length > 0 && (
                        <View style={styles.tabBadgePending}>
                            <Text style={styles.tabBadgeText}>{passengerRequests.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab('history')}
                    style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
                    {allCompletedPassengerRides.length > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{allCompletedPassengerRides.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={refreshing || isRefetching} onRefresh={onRefresh} />}
            >
                {isLoading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : (
                    <View style={styles.list}>
                        {activeTab === 'activeRides' && (
                            allActiveRides.length === 0 ? (
                                <EmptyState
                                    icon="car-outline"
                                    title="No active rides"
                                    subtitle="When your booking is confirmed, your active rides will appear here."
                                    ctaText="Search for rides"
                                    onCtaPress={() => router.push('/(tabs)/search')}
                                />
                            ) : (
                                allActiveRides.map((booking: any) => (
                                    <PassengerBookingCard
                                        key={booking.id || booking._id}
                                        booking={booking}
                                        style={styles.card}
                                        showStatus={true}
                                        onCancel={handleCancelBooking}
                                    />
                                ))
                            )
                        )}

                        {activeTab === 'passengerRequests' && (
                            passengerRequests.length === 0 ? (
                                <EmptyState
                                    icon="time-outline"
                                    title="No pending requests"
                                    subtitle="Your pending booking requests will appear here."
                                />
                            ) : (
                                passengerRequests.map((booking: any) => (
                                    <PassengerBookingCard
                                        key={booking.id || booking._id}
                                        booking={booking}
                                        style={styles.card}
                                        onCancel={handleCancelBooking}
                                    />
                                ))
                            )
                        )}

                        {activeTab === 'history' && (
                            allCompletedPassengerRides.length === 0 ? (
                                <EmptyState
                                    icon="document-outline"
                                    title="No ride history"
                                    subtitle="Completed rides will appear here."
                                />
                            ) : (
                                <>
                                    <Text style={styles.historySectionTitle}>Completed Rides as Passenger</Text>
                                    {allCompletedPassengerRides.map((booking: any) => (
                                        <PassengerBookingCard
                                            key={booking.id || booking._id}
                                            booking={booking}
                                            style={styles.card}
                                            showStatus={true}
                                        />
                                    ))}
                                </>
                            )
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

// Helper component for empty states (duplicated for self-containment)
const EmptyState = ({ icon, title, subtitle, ctaText, onCtaPress }: any) => (
    <View style={styles.emptyContainer}>
        <Ionicons name={icon} size={48} color={Colors.gray} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
        {ctaText && onCtaPress && (
            <TouchableOpacity style={styles.ctaButton} onPress={onCtaPress}>
                <Text style={styles.ctaText}>{ctaText}</Text>
            </TouchableOpacity>
        )}
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        flex: 1,
    },
    list: {
        padding: 16,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        marginBottom: 12,
        flexWrap: 'wrap',
        paddingHorizontal: 16,
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        minWidth: 80,
    },
    tabButtonActive: {
        backgroundColor: Colors.primary,
    },
    tabText: {
        color: '#666',
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#fff',
    },
    tabBadge: {
        backgroundColor: Colors.success,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
    },
    tabBadgePending: {
        backgroundColor: Colors.warning,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
    },
    tabBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    loaderContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
        justifyContent: 'center',
    },
    emptyIcon: {
        marginBottom: 16,
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.gray,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    ctaButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
    },
    ctaText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    historySectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 12,
        marginTop: 8,
    },
});
