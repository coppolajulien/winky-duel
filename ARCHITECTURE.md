# Winky Duel — Architecture

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│                    Next.js 16 + TypeScript                   │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Sidebar  │  │  Game Area   │  │   Blink Detection  │    │
│  │          │  │              │  │                     │    │
│  │ • Duels  │  │ • Countdown  │  │ MediaPipe Face      │    │
│  │ • Create │  │ • Chart      │  │ Landmarker          │    │
│  │ • Filter │  │ • Score      │  │                     │    │
│  │ • LBoard │  │ • TX Toasts  │  │ EAR Algorithm       │    │
│  │          │  │ • Avatar     │  │ (Eye Aspect Ratio)  │    │
│  └──────────┘  └──────────────┘  └────────────────────┘    │
│                                                             │
│  UI: Tailwind CSS + shadcn/ui    Charts: Recharts           │
│  Fonts: Inter + JetBrains Mono   Canvas: Face Wireframe     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    (Phase 2 — à venir)
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                      BLOCKCHAIN                             │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Privy     │  │   Pimlico    │  │   Smart Contract  │   │
│  │             │  │   Paymaster  │  │   (Solidity)      │   │
│  │ Auth wallet │  │              │  │                    │   │
│  │ Social      │  │ Gasless TX   │  │ • record_blink()  │   │
│  │ login       │  │ Sponsorisé   │  │ • create_duel()   │   │
│  └─────────────┘  └──────────────┘  │ • challenge()     │   │
│                                     │ • settle_duel()    │   │
│         MegaETH L2 (EVM)            │ • escrow stakes    │   │
│         100k+ TPS                   └──────────────────┘   │
│         Sub-ms latency                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Ce qui existe déjà (Phase 1 — Frontend) ✅

### Structure du projet

```
winky-duel/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── globals.css               # Tailwind + thème custom dark Euphoria
│   │   ├── layout.tsx                # Fonts (Inter, JetBrains Mono) + metadata
│   │   └── page.tsx                  # Entry point (dynamic import, ssr: false)
│   │
│   ├── components/                   # 13 composants React
│   │   ├── ui/                       # shadcn/ui (button, card, badge, tabs)
│   │   ├── GamePage.tsx              # Orchestrateur principal ("use client")
│   │   ├── Sidebar.tsx               # Navigation + connect button
│   │   ├── DuelsList.tsx             # Création duel + liste filtrable
│   │   ├── Leaderboard.tsx           # Prize pool + classement
│   │   ├── GridBackground.tsx        # Canvas animé (grille + dots roses)
│   │   ├── TxToast.tsx               # Notification pill (confirmed/pending)
│   │   ├── FaceMeshCanvas.tsx        # Canvas wireframe néon 160x120
│   │   ├── BlinkChart.tsx            # Courbe Recharts (AreaChart + gradient)
│   │   ├── PhaseIdle.tsx             # "Select a duel to begin"
│   │   ├── PhaseCountdown.tsx        # Countdown 3-2-1
│   │   ├── PhasePlaying.tsx          # Jeu (chart + timer + score + avatar)
│   │   ├── PhaseSubmitting.tsx       # Spinner "Recording on MegaETH..."
│   │   └── PhaseResult.tsx           # Résultat (WIN/LOSE/POSTED)
│   │
│   ├── hooks/                        # 3 hooks custom
│   │   ├── useTxToasts.ts            # Gestion des toasts TX (add/remove/confirm)
│   │   ├── useBlinkDetector.ts       # Caméra + MediaPipe + boucle détection
│   │   └── useGameLoop.ts            # Machine d'état du jeu + timer + score
│   │
│   └── lib/                          # Données et fonctions pures
│       ├── types.ts                  # GamePhase, Duel, TxToastData, ChartPoint...
│       ├── constants.ts              # DURATION=30, STAKES=[1,5,10,25,50]
│       ├── theme.ts                  # Palette P (pink, cyan, orange, bg)
│       ├── mockData.ts               # MOCK_DUELS, MOCK_LEADERBOARD
│       ├── faceMeshData.ts           # Landmarks yeux, mesh, lèvres
│       ├── blinkDetection.ts         # computeEAR() — Eye Aspect Ratio
│       ├── drawMesh.ts              # Rendu wireframe néon sur canvas
│       └── utils.ts                  # cn() helper (shadcn)
│
├── tailwind.config.ts / globals.css  # Thème dark Euphoria
└── package.json                      # next, recharts, @mediapipe/tasks-vision
```

### Flux de données actuel

```
  Caméra (getUserMedia)
      │
      ▼
  MediaPipe FaceLandmarker
      │ 478 landmarks facials
      ▼
  computeEAR()                    ◄── EAR < 0.21 pendant 2+ frames
      │                                = yeux fermés
      ▼
  onBlink()
      │
      ├──► setMyScore(+1)         Score
      ├──► addTx()                Toast TX mock (pending → confirmed)
      ├──► triggerFlash()         Flash rouge sur l'avatar
      └──► chartData.push()       Point sur la courbe

  Timer (setInterval 1s)
      │ timeLeft-- chaque seconde
      ▼
  timeLeft === 0 → finish()
      │
      ▼
  Phase "result"                  WIN / LOSE / POSTED
```

### Composant Orchestrateur (GamePage.tsx)

```
GamePage (use client)
  │
  ├── useTxToasts()               → { txToasts, addTx, removeTx, resetToasts }
  ├── useBlinkDetector()          → { videoRef, canvasRef, initCamera, triggerFlash }
  ├── useGameLoop()               → { phase, score, timer, doBlink, launch, reset... }
  │
  ├── <Sidebar>                   Gauche (300px fixe)
  │     ├── <DuelsList>           Créer un duel + liste ouverte
  │     └── <Leaderboard>         Prize pool + top 6
  │
  └── <GridBackground>            Droite (flex-1)
        ├── <PhaseIdle>
        ├── <PhaseCountdown>
        ├── <PhasePlaying>
        │     ├── <BlinkChart>
        │     ├── <TxToast> ×6
        │     └── <FaceMeshCanvas>
        ├── <PhaseSubmitting>
        └── <PhaseResult>
```

---

## Comparaison avec winky-starkzap (le repo de ton pote)

| Feature | winky-starkzap (Starknet) | winky-duel (MegaETH) |
|---|---|---|
| **Blockchain** | Starknet (Cairo) | MegaETH L2 (EVM/Solidity) |
| **Mode de jeu** | Solo — blinks illimités | Duel 1v1 asynchrone + leaderboard |
| **Paris/Stakes** | Non | $1/$5/$10/$25/$50 avec escrow |
| **Auth wallet** | Privy + Starkzap SDK | Privy (à venir) |
| **Gasless** | AVNU Paymaster | Pimlico Paymaster (à venir) |
| **Backend API** | Express (wallet signing, paymaster proxy) | Non encore (Phase 2) |
| **Smart Contract** | `record_blink()` simple (compteur) | Escrow + duels + settlement (à faire) |
| **Blink Detection** | MediaPipe (WASM local) | MediaPipe (CDN) |
| **Real-time** | Pusher WebSockets (live feed) | Non encore |
| **Social** | Twitter/X OAuth | Non encore |
| **Avatar** | Overlay sur la vidéo réelle | Wireframe néon 3D (visage jamais montré) |
| **UI** | Plein écran, mobile-first | Layout 3 zones, desktop-first |
| **Monétisation** | Non | 5% rake sur chaque duel |

### Ce que winky-starkzap fait de plus
- Live feed temps réel (Pusher WebSockets) — voir les blinks des autres en live
- Twitter/X auth pour lier l'identité sociale
- Leaderboard on-chain (lecture directe des events blockchain)
- Backend API (Express) pour signer les TX côté serveur et proxy le paymaster
- Blink card partageable (image générée)

### Ce que winky-duel fait de plus
- Mode duel 1v1 avec stakes (paris)
- Courbe de trading style Euphoria en temps réel
- Avatar wireframe néon 3D (privacy-first, visage jamais montré)
- Toast notifications TX overlay sur la courbe
- Challenge asynchrone (pas besoin d'être en ligne en même temps)
- Prize pool hebdomadaire ($250)
- Monétisation via le rake (5%)

---

## Ce qu'il reste à construire (Phase 2+)

### Backend API (Express ou Next.js API Routes)
```
api/
├── routes/
│   ├── paymaster.ts              Proxy Pimlico (clé API serveur)
│   └── wallet.ts                 Création wallet via Privy server SDK
├── middleware/
│   └── auth.ts                   Vérification token Privy
└── server.ts
```

### Smart Contract (Solidity — MegaETH)
```solidity
contract WinkyDuel {
    // Escrow pour les mises
    mapping(uint256 => Duel) public duels;

    struct Duel {
        address creator;
        uint256 stake;
        uint256 creatorScore;
        uint256 challengerScore;
        address challenger;
        bool settled;
    }

    function createDuel(uint256 score) external payable;
    function challengeDuel(uint256 duelId, uint256 score) external payable;
    function settleDuel(uint256 duelId) external;  // auto-compare scores
    function recordBlink(uint256 duelId) external;  // each blink = 1 TX
}
```

### Intégration Wallet (Privy + Pimlico)
```
Utilisateur → Privy (email/Google login)
                │
                ▼
         Smart Account (ERC-4337)
                │
                ▼
         Pimlico Paymaster (gasless)
                │
                ▼
         MegaETH L2 Transaction
```
