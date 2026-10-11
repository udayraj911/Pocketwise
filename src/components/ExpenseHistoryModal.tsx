/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Receipt, CheckCircle, Shield } from 'lucide-react';
import { PastExpenseItem } from '../types/finance';
import { formatINR } from '../utils/financeCalculations';

interface ExpenseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: PastExpenseItem[];
  totalSpent: number;
}

export const ExpenseHistoryModal: React.FC<ExpenseHistoryModalProps> = ({
  isOpen,
  onClose,
  expenses,
  totalSpent,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-[#E8E3DA] space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#133226] text-[#D4F478] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C2B22]">
                Spending Ledger
              </h3>
              <p className="text-xs text-[#5E7166]">
                Total logged so far: <strong className="text-[#133226]">{formatINR(totalSpent)}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-[#F2EDE4] flex items-center justify-center text-[#5E7166]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#F0EBE2] pr-1">
          {expenses.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#1C2B22]">
                    {item.name}
                  </span>
                  {item.essential && (
                    <span className="text-[10px] font-bold text-[#133226] bg-[#E1F7C5] px-1.5 py-0.5 rounded">
                      Essential
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#5E7166]">
                  <span>Day {item.day}</span>
                  <span className="mx-1.5">·</span>
                  <span>{item.category}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold tabular-nums text-[#1C2B22]">
                  {formatINR(item.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#F0EBE2] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-[#133226] text-white rounded-xl hover:bg-[#1C4233]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
