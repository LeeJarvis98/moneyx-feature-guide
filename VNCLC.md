# VNCLC Platform Overview

VNCLC is a trading bot (EA) platform for MT4/MT5, developed by Tradi. The platform features a robust, multi-tier affiliation system designed to reward partners through a structured referral network.

## 🛠 Tech Stack

| Component | Technology |
| --- | --- |
| **Frontend UI** | Mantine, HTML, CSS |
| **Backend & Framework** | Next.js, TypeScript |
| **Database** | Supabase |
| **Security** | Turnstile (Captcha Authorization) |
| **Communications** | Resend (Email Service) |

---

## 👥 User Roles & Access

The VNCLC ecosystem operates strictly on a referral-based access model, divided into two primary user roles:

1. **Members:** Standard users. To access the platform, a new user *must* register using a Referral ID from an existing Member or Partner. This links them as a client to their referrer.
2. **Partners ("Đại lý Tradi"):** Members who opt into the affiliation program to build their own downline and earn commissions.

---

## 🔗 The Affiliation System ("Đại lý Tradi")

### Core Architecture

The system relies on a **Referral Chain**, tracked from highest (left) to lowest (right).

* **ADMIN (Tradi)** is the core system account and will always be at the top of every chain.
* **SALE** is the secondary core node, representing Tradi's internal sales/collaborators.
* *Example Chain:* `[ADMIN, SALE, Partner A, Partner B, Partner C]`

### Rank Distribution & Mechanics

When a user upgrades to a Partner, their starting rank is determined by their position in the referral chain. The rank degrades sequentially for each new partner joining that specific downward branch until it hits the minimum rank (Đồng).

| Rank | Reward Keep | Upline Share | Requirement to Achieve | Notes |
| --- | --- | --- | --- | --- |
| **ADMIN** | 100% | 0% | N/A | Tradi Owner/Founder only |
| **SALE** | 95% | 5% | N/A | Internal Sales/Private Collaborators |
| **Kim Cương** | 90% | 10% | Total 2000 lots | Highest achievable public rank |
| **Bạch Kim** | 85% | 15% | Total 1000 lots |  |
| **Vàng** | 80% | 20% | Total 500 lots |  |
| **Bạc** | 75% | 25% | Total 100 lots |  |
| **Đồng** | 70% | 30% | Default starting rank (if deep in chain) | Minimum rank |

---

## 🧮 Commission Calculation Logic

Rewards are calculated and distributed on the **1st day of every month**. The logic dictates how a partner's generated revenue is split between themselves, Tradi, and their upline.

### General Formula

For any given Partner ($P$) generating a total monthly reward ($R_{total}$), their base "Share Percentage" ($S_{percentage}$) creates a Commission Pool ($C_{pool}$) that flows upward.
$$C_{pool} = R_{total} \times S_{percentage}$$

From this pool, Tradi takes a flat 5% fee:
$$C_{tradi} = C_{pool} \times 0.05$$

The remaining pool ($P_{remaining}$) is then distributed to the upline:
$$P_{remaining} = C_{pool} - C_{tradi}$$

The **direct referrer** (the partner immediately to the left) takes 50% of the remaining pool:
$$R_{direct} = P_{remaining} \times 0.50$$

The remaining 50% is divided **equally** among all other indirect upline partners ($N_{upline}$), excluding ADMIN:
$$R_{indirect} = \frac{P_{remaining} \times 0.50}{N_{upline} - 2}$$

The Partner ($P$) keeps their baseline reward:
$$Keep_{partner} = R_{total} - C_{pool}$$

### Calculation Examples

**Scenario 1: Standard Deep Chain**

* **Chain:** `[ADMIN, SALE, A, B, C, D, John, E, F]`
* **Target:** John (Rank: Đồng / 30% Upline Share)
* **Generated Reward:** $300
* **Commission Pool:** $300 * 30% = **$90**
* **Tradi Fee:** $90 * 5% = **$4.50**
* **Remaining Pool:** $90 - $4.50 = **$85.50**
* **Direct Referrer (D):** $85.50 * 50% = **$42.75**
* **Indirect Upline (SALE, A, B, C):** $42.75 / 4 = **$10.68** each
* **John's Keep:** $300 - $90 = **$210**

**Scenario 2: Direct to SALE (Case 1)**

* **Chain:** `[ADMIN, SALE, John, A, B]`
* **Target:** John (Rank: Kim Cương / 10% Upline Share)
* **Generated Reward:** $300
* **Commission Pool:** $300 * 10% = **$30**
* **Tradi Fee:** $30 * 5% = **$1.50**
* **Remaining Pool:** $30 - $1.50 = **$28.50**
* **Direct Referrer (SALE):** Takes the entirety of the remaining pool = **$28.50** (Because there are no other indirect partners between SALE and ADMIN)
* **John's Keep:** $300 - $30 = **$270**

**Scenario 3: SALE Node (Case 2)**

* **Chain:** `[ADMIN, SALE]`
* **Target:** SALE (Rank: SALE / 5% Upline Share)
* **Generated Reward:** $300
* **Commission Pool:** $300 * 5% = **$15**
* **Tradi Fee:** Takes the entirety of the pool = **$15**
* **SALE's Keep:** $300 - $15 = **$285**