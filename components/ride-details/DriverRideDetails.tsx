import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/Constants/Colors';
import { useDriverRides, useRideHistory, useCurrentRideRequests } from '@/hooks/useRides';
import { useUserMode } from '@/hooks/useDriverActiveRide';
import { RideCard } from '@/components/shared/RideCard';
import { PendingPaymentRideCard } from '@/components/shared/PendingPaymentRideCard';

export const DriverRideDetails = ({ user }: { user: any }) => {
    const router = useRouter();
    const {
        activeRide,
        refetch: refetchMode,
        showDriverFeatures
    } = useUserMode();

    // Offered rides for drivers should call GET /rides (driver's own offers)
    const {
        data: offeredRidesRaw = [],
        isLoading: isLoadingOffered,
        refetch: refetchOffered,
        isRefetching: isRefetchingOffered
    } = useDriverRides();

    // Also fetch ride history separately as fallback
    const {
        data: historyRidesRaw = [],
        isLoading: isLoadingHistory,
        refetch: refetchHistory,
        isRefetching: isRefetchingHistory
    } = useRideHistory();

    const { refetch: refetchCurrentRide, isRefetching: isRefetchingCurrentRide } = useCurrentRideRequests();

    // Combine offered rides with history rides
    const allDriverRides = useMemo(() => {
        const allRides = [...offeredRidesRaw];
        if (historyRidesRaw && historyRidesRaw.length > 0) {
            const offeredIds = new Set(offeredRidesRaw.map((r: any) => r.id || r._id));
            historyRidesRaw.forEach((ride: any) => {
                const id = ride.id || ride._id;
                if (!offeredIds.has(id)) {
                    allRides.push(ride);
                }
            });
        }
        return allRides;
    }, [offeredRidesRaw, historyRidesRaw]);

    // Deduplicate and filter rides
    const { activeOfferedRides, completedOfferedRides, pendingPaymentRides } = useMemo(() => {
        const seen = new Set();
        const active: any[] = [];
        const completed: any[] = [];
        const pendingPayment: any[] = [];

        allDriverRides.forEach((ride: any) => {
            const id = ride.id || ride._id;
            if (seen.has(id)) return;
            seen.add(id);

            const status = ride.rideStatus || ride.status || ride.ride?.rideStatus || ride.ride?.status;
            const paymentStatus = ride.paymentStatus || ride.allPaymentsCompleted;

            const hasPendingPayments =
                paymentStatus === 'PENDING' ||
                paymentStatus === 'pending' ||
                paymentStatus === 'partial' ||
                paymentStatus === 'PARTIAL' ||
                ride.allPaymentsCompleted === false ||
                ride.allPaymentsCompleted === null;

            const isCompleted = status === 'completed' || status === 'COMPLETED';

            if (status === 'scheduled' ||
                status === 'in_progress' ||
                status === 'PAYMENT_PENDING' ||
                status === 'CREATED' ||
                status === 'ONGOING') {
                active.push(ride);
            }
            else if (isCompleted && hasPendingPayments) {
                pendingPayment.push(ride);
                completed.push(ride);
            }
            else if (isCompleted) {
                completed.push(ride);
            }
            else if (status === undefined || status === null) {
                if (ride.isActive === false) {
                    completed.push(ride);
                } else {
                    active.push(ride);
                }
            }
        });

        return { activeOfferedRides: active, completedOfferedRides: completed, pendingPaymentRides: pendingPayment };
    }, [allDriverRides]);

    // For backward compatibility
    const offeredRides = activeOfferedRides;

    const [activeTab, setActiveTab] = useState<'offered' | 'pendingPayment' | 'history'>('offered');
    const [refreshing, setRefreshing] = useState(false);

    // Poll when active ride is in progress
    useEffect(() => {
        if (showDriverFeatures && activeRide && (activeRide.rideStatus === 'in_progress' || activeTab === 'offered')) {
            const driverPollingInterval = setInterval(() => {
                refetchMode();
                refetchOffered();
                refetchCurrentRide();
            }, 10000);

            return () => clearInterval(driverPollingInterval);
        }
    }, [showDriverFeatures, activeRide, activeTab]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await refetchMode();
            await Promise.all([refetchOffered(), refetchHistory()]);
        } finally {
            setRefreshing(false);
        }
    };

    const isLoading = isLoadingOffered || isLoadingHistory;
    const isRefetching = isRefetchingOffered || isRefetchingHistory || isRefetchingCurrentRide;

    return (
        <View style={styles.container}>
            {/* Driver Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    onPress={() => setActiveTab('offered')}
                    style={[styles.tabButton, activeTab === 'offered' && styles.tabButtonActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'offered' && styles.tabTextActive]}>Active Ride</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab('pendingPayment')}
                    style={[styles.tabButton, activeTab === 'pendingPayment' && styles.tabButtonActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'pendingPayment' && styles.tabTextActive]}>Pending Payment</Text>
                    {pendingPaymentRides.length > 0 && (
                        <View style={styles.tabBadgePending}>
                            <Text style={styles.tabBadgeText}>{pendingPaymentRides.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab('history')}
                    style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
                    {completedOfferedRides.length > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{completedOfferedRides.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Active Ride Banner */}
            {activeRide && (
                <View style={styles.activeRideBanner}>
                    <View style={styles.activeRideBannerContent}>
                        <Ionicons name="car" size={20} color={Colors.primary} />
                        <View style={styles.activeRideBannerText}>
                            <Text style={styles.activeRideBannerTitle}>Active Ride</Text>
                            <Text style={styles.activeRideBannerRoute}>
                                {activeRide.from?.city || 'Origin'} → {activeRide.to?.city || 'Destination'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.activeRideBannerButton}
                        onPress={() => router.push(`/ride/${activeRide.id || activeRide._id}`)}
                    >
                        <Text style={styles.activeRideBannerButtonText}>View</Text>
                    </TouchableOpacity>
                </View>
            )}

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
                        {activeTab === 'offered' && (
                            offeredRides.length === 0 ? (
                                <EmptyState
                                    icon="car-outline"
                                    title="No active rides"
                                    subtitle="Create your first ride to see it here."
                                    ctaText="Offer a ride"
                                    onCtaPress={() => router.push('/ride/create')}
                                />
                            ) : (
                                offeredRides.map((ride: any) => (
                                    <RideCard key={ride.id} ride={ride} onPress={() => router.push(`/ride/${ride.id}`)} style={styles.card} />
                                ))
                            )
                        )}

                        {activeTab === 'pendingPayment' && (
                            pendingPaymentRides.length === 0 ? (
                                <EmptyState
                                    icon="wallet-outline"
                                    title="No pending payments"
                                    subtitle="All payments have been completed."
                                />
                            ) : (
                                pendingPaymentRides.map((ride: any) => (
                                    <PendingPaymentRideCard
                                        key={ride.id || ride._id}
                                        ride={ride}
                                        style={styles.card}
                                    />
                                ))
                            )
                        )}

                        {activeTab === 'history' && (
                            completedOfferedRides.length === 0 ? (
                                <EmptyState
                                    icon="time-outline"
                                    title="No ride history"
                                    subtitle="Completed rides will appear here."
                                />
                            ) : (
                                <>
                                    <Text style={styles.historySectionTitle}>Completed Rides as Driver</Text>
                                    {completedOfferedRides.map((ride: any) => (
                                        <RideCard key={ride.id || ride._id} ride={ride} onPress={() => router.push(`/ride/${ride.id || ride._id}`)} style={styles.card} />
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

// Helper component for empty states
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
    activeRideBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.lightPrimary,
        margin: 16,
        marginTop: 0,
        marginBottom: 0,
        padding: 12,
    },
    activeRideBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    activeRideBannerText: {
        flex: 1,
    },
    activeRideBannerTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    activeRideBannerRoute: {
        fontSize: 12,
        color: Colors.text,
        opacity: 0.8,
    },
    activeRideBannerButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    activeRideBannerButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
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
