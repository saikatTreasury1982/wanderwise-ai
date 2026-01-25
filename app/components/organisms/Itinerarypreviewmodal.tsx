'use client';

import { useState, useEffect } from 'react';
import CircleIconButton from '@/app/components/ui/CircleIconButton';

interface Activity {
    activity_name: string;
    start_time: string | null;
    end_time: string | null;
    activity_cost: number | null;
    currency_code: string | null;
}

interface Category {
    category_name: string;
    category_cost: number | null;
    currency_code: string | null;
    activities: Activity[];
}

interface ItineraryDay {
    day_code: string;
    day_description: string | null;
    categories: Category[];
    source: {
        trip_name: string;
        start_date: string;
        end_date: string;
    };
}

type ItineraryDayWithIndex = ItineraryDay | { data: ItineraryDay; index: number };

interface ItineraryPreviewModalProps {
    isOpen: boolean;
    onClose: (selections?: { categoryIndex: number; activityIndex: number }[]) => void;
    onAdd: (selections: { categoryIndex: number; activityIndex: number }[]) => void;
    day: any;
    initialSelections?: { categoryIndex: number; activityIndex: number }[];
}

export default function ItineraryPreviewModal({
    isOpen,
    onClose,
    onAdd,
    day,
    initialSelections = [],
}: ItineraryPreviewModalProps) {
    // Hide scrollbar CSS
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);
    const [selections, setSelections] = useState<{ categoryIndex: number; activityIndex: number }[]>(initialSelections);

    useEffect(() => {
        if (isOpen) {
            setSelections(initialSelections);
        }
    }, [isOpen, initialSelections]);

    if (!isOpen || !day) return null;

    const isActivitySelected = (catIndex: number, actIndex: number) => {
        return selections.some(s => s.categoryIndex === catIndex && s.activityIndex === actIndex);
    };

    const toggleActivity = (catIndex: number, actIndex: number) => {
        setSelections(prev => {
            const exists = prev.some(s => s.categoryIndex === catIndex && s.activityIndex === actIndex);
            if (exists) {
                return prev.filter(s => !(s.categoryIndex === catIndex && s.activityIndex === actIndex));
            } else {
                return [...prev, { categoryIndex: catIndex, activityIndex: actIndex }];
            }
        });
    };

    const toggleCategory = (catIndex: number) => {
        const category = day.categories[catIndex];
        const categoryActivities = category.activities || [];
        const allSelected = categoryActivities.every((_: any, actIndex: number) => isActivitySelected(catIndex, actIndex));

        if (allSelected) {
            // Unselect all activities in this category
            setSelections(prev => prev.filter(s => s.categoryIndex !== catIndex));
        } else {
            // Select all activities in this category
            const newSelections = categoryActivities.map((_: any, actIndex: number) => ({ categoryIndex: catIndex, activityIndex: actIndex }));
            setSelections(prev => {
                const filtered = prev.filter(s => s.categoryIndex !== catIndex);
                return [...filtered, ...newSelections];
            });
        }
    };

    const isCategoryFullySelected = (catIndex: number) => {
        const category = day.categories[catIndex];
        const categoryActivities = category.activities || [];
        return categoryActivities.length > 0 && categoryActivities.every((_: any, actIndex: number) => isActivitySelected(catIndex, actIndex));
    };

    const isCategoryPartiallySelected = (catIndex: number) => {
        const category = day.categories[catIndex];
        const categoryActivities = category.activities || [];
        return categoryActivities.some((_: any, actIndex: number) => isActivitySelected(catIndex, actIndex)) && !isCategoryFullySelected(catIndex);
    };

    // Calculate counts
    const selectedCategoryIndices = new Set(selections.map(s => s.categoryIndex));
    const selectedCategoriesCount = selectedCategoryIndices.size;
    const selectedActivitiesCount = selections.length;

    const totalCategories = day.categories?.length || 0;
    const totalActivities = day.categories?.reduce((sum: number, cat: any) => sum + (cat.activities?.length || 0), 0) || 0;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={() => onClose()}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="bg-gradient-to-br from-black-900/40 via-indigo-900/30 to-black-900/40 backdrop-blur-2xl border border-white/20 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">{day.day_code}</h3>
                            {day.day_description && (
                                <p className="text-white/60 text-sm">{day.day_description}</p>
                            )}
                            <p className="text-purple-300 text-sm mt-2">
                                From: {day.source.trip_name}
                            </p>
                        </div>
                        <CircleIconButton
                            variant="default"
                            onClick={() => onClose(selections)}
                            title="Close"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            }
                        />
                    </div>

                    {/* Summary */}
                    <div className="px-6 py-4 bg-purple-500/10 border-b border-white/10">
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-white/70">{totalCategories} Categories</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="text-white/70">{totalActivities} Activities</span>
                            </div>
                        </div>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="p-6 overflow-y-auto max-h-[calc(80vh-220px)] hide-scrollbar">
                        <div className="space-y-4">
                            {day.categories.map((category: any, catIndex: number) => (
                                <div
                                    key={catIndex}
                                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
                                >
                                    {/* Category Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => toggleCategory(catIndex)}
                                                className="flex-shrink-0"
                                            >
                                                {isCategoryFullySelected(catIndex) ? (
                                                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                ) : isCategoryPartiallySelected(catIndex) ? (
                                                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                                    </svg>
                                                )}
                                            </button>
                                            <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            <h4 className="text-white font-semibold">{category.category_name}</h4>
                                        </div>
                                        <span className="text-xs text-white/50">
                                            {category.activities?.length || 0} activities
                                        </span>
                                    </div>

                                    {/* Activities */}
                                    <div className="space-y-2">
                                        {category.activities && category.activities.length > 0 ? (
                                            category.activities.map((activity: any, actIndex: number) => (
                                                <div
                                                    key={actIndex}
                                                    className="flex items-start gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                                                    onClick={() => toggleActivity(catIndex, actIndex)}
                                                >
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {isActivitySelected(catIndex, actIndex) ? (
                                                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white/90 text-sm">{activity.activity_name}</p>
                                                        {activity.start_time && (
                                                            <p className="text-white/50 text-xs mt-1">
                                                                {activity.start_time}
                                                                {activity.end_time && ` - ${activity.end_time}`}
                                                            </p>
                                                        )}
                                                        {activity.activity_cost && (
                                                            <p className="text-purple-300 text-xs mt-1">
                                                                {activity.currency_code} {activity.activity_cost.toFixed(2)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-white/40 text-sm italic">No activities</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selection Footer */}
                    <div className="flex items-center justify-between p-2 border-t border-white/10 bg-purple-500/5">
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-white font-medium">{selectedCategoriesCount}</span>
                                <span className="text-white/70">{selectedCategoriesCount === 1 ? 'category' : 'categories'}</span>
                            </div>
                            <div className="w-px h-4 bg-white/20" />
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="text-white font-medium">{selectedActivitiesCount}</span>
                                <span className="text-white/70">{selectedActivitiesCount === 1 ? 'activity' : 'activities'} selected</span>
                            </div>
                        </div>
                        <CircleIconButton
                            variant="primary"
                            onClick={() => {
                                if (selections.length === 0) {
                                    alert('Please select at least one activity');
                                    return;
                                }
                                onAdd(selections);
                                onClose(selections);
                            }}
                            title="Add to trip"
                            disabled={selections.length === 0}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            }
                        />
                    </div>
                </div>
            </div>
        </>
    );
}