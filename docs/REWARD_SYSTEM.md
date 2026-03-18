# Reward System Specification

## 1. System Overview
This feature provides a customizable **Reward System** that registered partners can configure for their referred clients. 

**Key Characteristics:**
* **Level Structure:** The system consists of 11 predefined levels (Level 0 through 10). 
* **Customization:** Partners can choose which specific levels to activate for their clients.
* **Platform Specificity:** The reward system is tied to a specific trading platform, which is also configurable by the partner.
* **Fixed Baseline:** Level 0 is permanently fixed at `0 lots = $0` and cannot be altered.
* **Custom Rewards:** Remaining levels follow the format: `Level N (N lots) = $N | [Optional Text]`.

---

## 2. Example Configuration (Partner View)
Below is an example of a fully utilized 11-level configuration in a real-world scenario:

| Level | Lot Volume | USD Reward | Optional Text Reward (Vietnamese) |
| :--- | :--- | :--- | :--- |
| **0** | 0 lots | $0 | *(Fixed baseline)* |
| **1** | 10 lots | $200 | |
| **2** | 20 lots | $400 | |
| **3** | 40 lots | $600 | |
| **4** | 80 lots | $1,000 | hoặc Điện thoại cao cấp |
| **5** | 200 lots | $1,400 | |
| **6** | 500 lots | $2,000 | hoặc TV cao cấp |
| **7** | 1,000 lots | $6,000 | hoặc Chuyến du lịch Việt Nam |
| **8** | 1,500 lots | $10,000 | hoặc Chuyến du lịch Quốc tế |
| **9** | 2,000 lots | $16,000 | hoặc Đồng hồ cao cấp |
| **10** | 3,000 lots | $20,000 | hoặc Xe hơi cao cấp |

---

## 3. User Flow & Frontend Implementation

When a referred user logs into the application:
1.  **Navigation:** The user navigates to the **Hệ Thống Thưởng** (Reward System) page (only show for logged-in user; guest should be hidden).
2.  **Data Validation:** The system queries the database to match the user with their referrer's (partner's) specific reward configuration (Table A).
3.  **Progress Calculation:** The system checks the `licensed_accounts` table to calculate the user's total lot volume on the specific trading platform tied to this reward system.
4.  **Eligibility Check:** The logic evaluates the total lots against the partner's configured levels to determine the user's current level and prize eligibility.
5.  **UI Display:** Data from Table A is passed to the frontend and rendered using a **Mantine Timeline component**, providing the user with a visual representation of their current progress, past achievements, and upcoming rewards.

---

## 4. Database Schema Proposal

To support this logic, we need to map the configurations and user tracking to the following tables.

### Table A: `partner_reward_configs`
This table stores the customized reward system parameters for each partner.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `uuid` | UUID | Primary Key. |
| `partner_id` | TEXT | Foreign Key linking to the registered partner. |
| `platform` | TEXT | Foreign Key linking to the configured trading platform. |
| `level` | INT | The reward level (0 to 10). |
| `lot_volume` | DECIMAL | Required lot volume to achieve this level. |
| `reward_usd` | DECIMAL | Cash reward amount in USD. |
| `reward_text` | VARCHAR | (Optional) Physical prize or alternative text description. |
| `is_active` | BOOLEAN | Indicates if the partner has enabled this specific level. |
| `created_at` | TIMESTAMP | Record creation timestamp. |
| `updated_at` | TIMESTAMP | Record update timestamp. |

### Table B: `user_reward_tracking`
This table logs the progress, level achievements, and claim status for each user under a partner's system.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `uuid` | UUID | Primary Key. |
| `user_id` | TEXT | Foreign Key linking to the referred user. |
| `partner_id` | TEXT | Foreign Key linking to the referring partner. |
| `current_level` | INT | The highest level the user has currently achieved. |
| `current_lot_volume`| DECIMAL | Cached/Current total lot volume for quick lookup. |
| `eligible_for_prize`| BOOLEAN | Flag indicating if an unclaimed prize is available. |
| `last_calculated` | TIMESTAMP | Timestamp of the last lot volume calculation. |

> **Note:** The existing `licensed_accounts` table will remain the source of truth for the raw trading volume. Table B acts as a caching and state-tracking layer to optimize the frontend rendering and prize claim logic.