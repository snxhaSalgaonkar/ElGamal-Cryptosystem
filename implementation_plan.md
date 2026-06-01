# ElGamal Cryptosystem Redesign Implementation Plan

This plan documents a comprehensive visual and functional overhaul of the ElGamal Cryptosystem learning application. It replaces the classic sidebar-driven dashboard structure with a modern website layout: a visually rich **landing page with a Hero section**, an **interactive scroll-down Learn section**, and a unified **sequential Get Started Wizard** that leads the user seamlessly from text input through modular arithmetic encryption and decryption, all on a single unified canvas.

## User Review Required

> [!IMPORTANT]
> - **Unified Asymmetric Workflow**: Instead of separating KeyGen, Encryption, and Decryption into standalone tabs requiring manual payload copying, clicking **Get Started** will open an interactive 4-step wizard that maintains shared states ($p, g, y, x$, message $M$, and $c_1, c_2$ blocks) across a unified timeline.
> - **Scroll-based Learning Architecture**: The standalone labs (DLP Hardness, Probabilistic Semantic Security, and Ephemeral Key Reuse Vulnerability) will be elegantly integrated into the landing page's **Learn** section. Scrolling down or clicking **Learn** takes the user into this interactive math catalog.
> - **Toy Mode Robustness**: We preserve small parameter support ($p=23$) so beginners can trace integer calculations without overflows, while automatically unlocking rich multi-character UTF-8 string encoding for larger prime lengths.

## Proposed Changes

We will restructure the frontend code to transform it into a premium modern landing page and unified wizard.

---

### Frontend Components

#### [NEW] [CryptoWizard.jsx](file:///c:/Users/Sneha/Desktop/cnt-ppt/ElGamal-Cryptosystem/frontend/src/components/CryptoWizard.jsx)
Create a step-by-step interactive cryptographic playground.
- **Step 1: System Parameters & Message Input**
  - Choose prime strength (Toy parameters $p=23$ or Secure prime $128$/$256$/$512$ bits).
  - Input field for the message (validates integers between $1$ and $p-1$ for Toy Mode, and standard text strings for Secure Mode).
- **Step 2: Key Generation**
  - Interactive parameter display detailing prime modulus $p$, cyclic generator $g$, private secret key $x$ (masked with a visibility toggle), and calculated public key $y = g^x \bmod p$.
  - Generates keys live by communicating with `/api/keygen`.
- **Step 3: Alice's Encryption**
  - Sends the message block or text to `/api/encrypt`.
  - Visualizes the text chunking mechanism (if applicable) and shows the step-by-step modular mathematics for each block:
    - Choose random ephemeral key $k$.
    - Compute ephemeral ciphertext component $c_1 = g^k \bmod p$.
    - Compute shared secret $s = y^k \bmod p$.
    - Compute encrypted block mask $c_2 = (M \cdot s) \bmod p$.
- **Step 4: Bob's Decryption & Message Recovery**
  - Performs modular division using the secret exponent $x$ by calling `/api/decrypt` with the intercepted blocks.
  - Visualizes the step-by-step decryption arithmetic:
    - Reconstruct shared secret $s = c_1^x \bmod p$.
    - Compute modular multiplicative inverse $s^{-1} \bmod p$ via the Extended Euclidean Algorithm.
    - Decrypt raw block $M = (c_2 \cdot s^{-1}) \bmod p$.
    - Reconstruct and decode text strings, presenting the final output in a glowing emerald success banner!

#### [MODIFY] [App.jsx](file:///c:/Users/Sneha/Desktop/cnt-ppt/ElGamal-Cryptosystem/frontend/src/App.jsx)
Refactor the entry component to remove the static sidebar, setting up a responsive website shell:
- **Hero Landing Page** with vibrant gradients, custom animated background elements, and descriptive typography.
- **Call-to-Action Buttons**:
  - `Learn & Explore` (Scrolls down smoothly to the interactive mathematical explanations & laboratories).
  - `Get Started Wizard` (Switches the layout view to the interactive sequential wizard).
- **Interactive Learn Catalog**:
  - Educational cards explaining Key Generation, Asymmetric Encryption, and Decryption with clear hover states and animations.
  - **Embedded Laboratories Section**: Integrates `DLPDemo`, `ProbabilisticDemo`, and `EphemeralDanger` as tabbed or card-triggered drawers inside the educational section, giving the user access to advanced laboratories without leaving the main page.

#### [MODIFY] [index.css](file:///c:/Users/Sneha/Desktop/cnt-ppt/ElGamal-Cryptosystem/frontend/src/index.css)
Inject brand-new custom styles to implement the premium landing page and wizard components, including:
- Smooth html scroll behaviors.
- Floating animations for Hero accents.
- Unified Wizard progress step indicators and connecting line tracks.
- Hover scaling cards and beautiful glassmorphism gradients.

---

## Verification Plan

### Automated & Manual Verification
- We will execute the frontend server and verify that:
  - The application renders the landing page correctly.
  - Clicking "Learn" triggers smooth scrolling to the explanation cards.
  - Interactive labs run without mathematical errors.
  - Entering numbers in Toy Mode does not crash, and yields correct encryption/decryption outputs.
  - Entering strings in Secure Mode chunks and recovers text perfectly.
  - Transitioning between wizard steps maintains visual state and shows clear formulas.
