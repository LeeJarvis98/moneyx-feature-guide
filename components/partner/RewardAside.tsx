"use client";

import { useState, useEffect } from "react";
import styles from "./RewardAside.module.css";
import type { BankInfo } from "@/app/api/update-bank-info/route";

const EMPTY_BANK_INFO: BankInfo = {
  bank_name: "",
  account_number: "",
  account_name: "",
};

export default function RewardAside() {
  const [bankInfo, setBankInfo] = useState<BankInfo>(EMPTY_BANK_INFO);
  const [originalBankInfo, setOriginalBankInfo] = useState<BankInfo>(EMPTY_BANK_INFO);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchBankInfo = async () => {
      try {
        const res = await fetch("/api/get-bank-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const json = await res.json();

        if (res.ok && json.bankInfo) {
          const loaded: BankInfo = {
            bank_name: json.bankInfo.bank_name ?? "",
            account_number: json.bankInfo.account_number ?? "",
            account_name: json.bankInfo.account_name ?? "",
          };
          setBankInfo(loaded);
          setOriginalBankInfo(loaded);
        }
      } catch (err) {
        console.error("[RewardAside] Error loading bank info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBankInfo();
  }, []);

  const hasChanges = () =>
    bankInfo.bank_name !== originalBankInfo.bank_name ||
    bankInfo.account_number !== originalBankInfo.account_number ||
    bankInfo.account_name !== originalBankInfo.account_name;

  const handleChange = (field: keyof BankInfo, value: string) => {
    setBankInfo((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleToggleEdit = () => {
    if (isEditMode) {
      setBankInfo(originalBankInfo);
    }
    setIsEditMode((prev) => !prev);
    setError(null);
  };

  const handleSave = async () => {
    const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
    if (!userId) {
      setError("Vui lòng đăng nhập lại.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/update-bank-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, bankInfo }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Không thể lưu thông tin.");
      }

      setOriginalBankInfo(bankInfo);
      setIsEditMode(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.headerTop}>
          <h3 className={styles.title}>Thông Tin Ngân Hàng</h3>
          <button
            onClick={handleToggleEdit}
            className={styles.editButton}
            disabled={saving}
          >
            {isEditMode ? "Hủy" : "Chỉnh sửa"}
          </button>
        </div>

        <p className={styles.hint}>
          Thông tin để nhận thưởng khi đạt cấp độ mới.
        </p>

        <div className={styles.formContainer}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="bank-name">
              Tên ngân hàng
            </label>
            <input
              id="bank-name"
              type="text"
              value={bankInfo.bank_name}
              onChange={(e) => handleChange("bank_name", e.target.value)}
              placeholder="VD: Vietcombank, BIDV, Techcombank..."
              className={styles.input}
              readOnly={!isEditMode}
              disabled={saving}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="account-number">
              Số tài khoản
            </label>
            <input
              id="account-number"
              type="text"
              value={bankInfo.account_number}
              onChange={(e) => handleChange("account_number", e.target.value)}
              placeholder="Nhập số tài khoản ngân hàng"
              className={styles.input}
              readOnly={!isEditMode}
              disabled={saving}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="account-name">
              Tên chủ tài khoản
            </label>
            <input
              id="account-name"
              type="text"
              value={bankInfo.account_name}
              onChange={(e) => handleChange("account_name", e.target.value)}
              placeholder="Nhập tên chủ tài khoản"
              className={styles.input}
              readOnly={!isEditMode}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>Lưu thành công!</div>}

      {isEditMode && hasChanges() && (
        <button
          onClick={handleSave}
          disabled={saving}
          className={styles.saveButton}
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      )}
    </div>
  );
}
