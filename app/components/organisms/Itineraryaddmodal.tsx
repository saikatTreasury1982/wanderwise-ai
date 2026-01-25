'use client';

import { useState, useEffect } from 'react';
import CircleIconButton from '@/app/components/ui/CircleIconButton';

interface ExistingDay {
    day_id: number;
    day_code: string;
}

interface CategoryWithActivities {
    categoryIndex: number;
    category_name: string;
    activities: { activityIndex: number; activity_name: string; start_time?: string | null; end_time?: string | null }[];
}

interface ItineraryAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (target: 'new' | number, finalSelections: { categoryIndex: number; activityIndex: number }[]) => void;
    existingDays: ExistingDay[];
    recommendedDayCode: string;
    dayData: any; // Full day data with categories and activities
    initialSelections: { categoryIndex: number; activityIndex: number }[];
}

export default function ItineraryAddModal({
    isOpen,
    onClose,
    onConfirm,
    existingDays,
    recommendedDayCode,
    dayData,
    initialSelections,
}: ItineraryAddModalProps) {
    const [selectedTarget, setSelectedTarget] = useState<'new' | number>('new');
    const [selections, setSelections] = useState<{ categoryIndex: number; activityIndex: number }[]>(initialSelections);

    useEffect(() => {
        if (isOpen) {
            setSelections(initialSelections);
        }
    }, [isOpen, initialSelections]);

    if (!isOpen || !dayData) return null;

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

    // Build filtered categories with only selected activities
    const filteredCategories: CategoryWithActivities[] = [];
    dayData.categories?.forEach((cat: any, catIndex: number) => {
        const selectedActivities = cat.activities?.map((act: any, actIndex: number) => ({
            activityIndex: actIndex,
            activity_name: act.activity_name,
            start_time: act.start_time,
            end_time: act.end_time,
        })).filter((act: any) => initialSelections.some(s => s.categoryIndex === catIndex && s.activityIndex === act.activityIndex));

        if (selectedActivities && selectedActivities.length > 0) {
            filteredCategories.push({
                categoryIndex: catIndex,
                category_name: cat.category_name,
                activities: selectedActivities,
            });
        }
    });

    // Calculate final counts
    const selectedCategoryIndices = new Set(selections.map(s => s.categoryIndex));
    const finalCategoriesCount = selectedCategoryIndices.size;
    const finalActivitiesCount = selections.length;

    const handleConfirm = () => {
        onConfirm(selectedTarget, selections);
    };

    // Calculate next day number for new day
    const nextDayNumber = existingDays.length + 1;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-blue-900/40 backdrop-blur-2xl border border-white/20 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10">
                        <h3 className="text-xl font-bold text-white mb-2">Add Itinerary Day</h3>
                        <p className="text-white/60 text-sm">
                            Review and finalize selections for "{recommendedDayCode}"
                        </p>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="p-6 overflow-y-auto max-h-[calc(80vh-260px)]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <div className="space-y-5">
                            {/* Dropdown */}
                            <div>
                                <label className="block text-sm text-white/70 mb-2">Add this day as:</label>
                                <select
                                    value={selectedTarget === 'new' ? 'new' : selectedTarget}
                                    onChange={(e) => setSelectedTarget(e.target.value === 'new' ? 'new' : Number(e.target.value))}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-base focus:outline-none focus:border-purple-400"
                                >
                                    <option value="new" className="bg-gray-800">
                                        New Day {nextDayNumber}
                                    </option>
                                    {existingDays.map((day) => (
                                        <option key={day.day_id} value={day.day_id} className="bg-gray-800">
                                            Append to {day.day_code} (existing)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selected Categories & Activities */}
                            <div>
                                <label className="block text-sm text-white/70 mb-3">Selected items (uncheck to remove):</label>
                                {filteredCategories.length > 0 ? (
                                    <div className="space-y-3">
                                        {filteredCategories.map((cat) => (
                                            <div key={cat.categoryIndex} className="bg-white/5 border border-white/10 rounded-lg p-4">
                                                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                    {cat.category_name}
                                                </h4>
                                                <div className="space-y-2 mt-2">
                                                    {cat.activities.map((act) => (
                                                        <div
                                                            key={act.activityIndex}
                                                            className="flex items-start gap-3 p-2 bg-white/5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                                                            onClick={() => toggleActivity(cat.categoryIndex, act.activityIndex)}
                                                        >
                                                            <div className="flex-shrink-0 mt-0.5">
                                                                {isActivitySelected(cat.categoryIndex, act.activityIndex) ? (
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
                                                                <p className="text-white/90 text-sm">{act.activity_name}</p>
                                                                {act.start_time && (
                                                                    <p className="text-white/50 text-xs mt-0.5">
                                                                        {act.start_time}{act.end_time && ` - ${act.end_time}`}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-white/50 text-sm italic">No items selected</p>
                                )}
                            </div>

                            {/* Info Box */}
                            {finalActivitiesCount > 0 && (
                                <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-purple-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="text-sm">
                                            <p className="text-white/90 font-medium mb-1">
                                                Will add {finalCategoriesCount} {finalCategoriesCount === 1 ? 'category' : 'categories'} • {finalActivitiesCount} {finalActivitiesCount === 1 ? 'activity' : 'activities'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Warning for append */}
                            {selectedTarget !== 'new' && finalActivitiesCount > 0 && (
                                <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <p className="text-yellow-200 text-sm">
                                            Categories will be added to the end of the existing day
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                        <CircleIconButton
                            variant="default"
                            onClick={onClose}
                            title="Cancel"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            }
                        />
                        <CircleIconButton
                            variant="primary"
                            onClick={handleConfirm}
                            title="Confirm Add"
                            disabled={finalActivitiesCount === 0}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            }
                        />
                    </div>
                </div>
            </div>
        </>
    );
}