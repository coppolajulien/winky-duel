# Winky Duel — Plan de développement

## Statut actuel

| Phase | Statut | Description |
|---|---|---|
| Phase 1 — Frontend | ✅ Terminé | UI complète, blink detection, game loop, mock data |
| Phase 2 — Smart Contract | ✅ Terminé | WinkyDuel.sol — escrow + duels + 42 tests passing |
| Phase 3 — Wallet Auth | ✅ Terminé | Privy login (sans Pimlico — users paient le gas) |
| Phase 4 — Intégration | ⬜ À faire | Connecter frontend ↔ blockchain |
| Phase 5 — Real-time | ⬜ À faire | WebSockets live feed + leaderboard on-chain |
| Phase 6 — Deploy | ⬜ À faire | Vercel (frontend) + MegaETH Testnet |

---

## Phase 2 — Smart Contract (Solidity)

### Objectif
Smart contract sur MegaETH pour gérer les duels et l'escrow des mises.

### Tâches

- [x] Installer Hardhat dans le projet
  ```
  winky-duel/
  └── contracts/
      ├── hardhat.config.ts
      ├── package.json
      ├── tsconfig.json
      ├── .env.example
      ├── contracts/
      │   └── WinkyDuel.sol
      ├── scripts/
      │   └── deploy.ts
      └── test/
          └── WinkyDuel.test.ts
  ```

- [x] Écrire `WinkyDuel.sol`
  - `createDuel(uint32 score)` payable — créer un duel avec stake + score
  - `challengeDuel(uint256 duelId, uint32 score)` payable — challenge + auto-settlement
  - `cancelDuel(uint256 duelId)` — créateur annule, récupère sa mise
  - `recordBlink(uint256 duelId)` — event-only (pas de SSTORE, économise gas)
  - `getOpenDuels()` / `getDuel()` — lire les duels
  - `withdrawRake()` — owner retire les 5% de commission
  - Events: `DuelCreated`, `DuelSettled`, `DuelCancelled`, `BlinkRecorded`, `RakeWithdrawn`

- [x] Écrire les tests (Hardhat + Chai) — **46 tests passing**
  - Création de duel avec stake USDM
  - Challenge gagnant → challenger gagne 95%
  - Challenge perdant → creator gagne 95%
  - Égalité → les deux récupèrent leur mise (pas de rake)
  - Cancel → creator récupère sa mise
  - Edge cases (même score, duel déjà settled, mauvais stake, duel inexistant, self-challenge)
  - recordBlink event
  - getOpenDuels swap-and-pop correctness
  - withdrawRake + ownership
  - USDM balance consistency

- [x] Déployer sur MegaETH Testnet (Chain ID 6343)
  - **WinkyDuel** : `0x558aB486A0FfA1f4Aa52DeFb9e0d9E03e3CD6F3a`
  - **MockUSDM** : `0x8A017435e8dD3aeCA65a1eA4411eD81b9302Ae9C`
  - Explorer : https://megaeth-testnet-v2.blockscout.com/address/0x558aB486A0FfA1f4Aa52DeFb9e0d9E03e3CD6F3a

### Inspiré de winky-starkzap
Le contract Cairo de ton pote est ultra simple (`record_blink` + compteur). Le nôtre est plus complexe car il gère l'**escrow** des mises et le **settlement** automatique des duels.

---

## Phase 3 — Wallet Auth (Privy)

### Objectif
Login via Privy (email, Google, Twitter, MetaMask) — pas de paymaster, les users paient leur gas (~$0.0002/tx sur MegaETH).

### Architecture
- **Privy** pour l'authentification (embedded wallets pour ceux sans MetaMask)
- **viem** pour les lectures blockchain (balance USDM)
- Pas de Pimlico/paymaster — gas trop peu cher pour justifier la complexité

### Tâches

- [x] Installer `@privy-io/react-auth` + `viem`
- [x] Créer `PrivyClientProvider.tsx` — wrapper PrivyProvider avec config MegaETH
- [x] Créer `useWallet.ts` — hook auth + lecture balance USDM via viem publicClient
- [x] Modifier `layout.tsx` — PrivyClientProvider wrapping ThemeProvider
- [x] Modifier `Sidebar.tsx` — vrai bouton Connect/Disconnect, balance USDM réelle
- [x] Modifier `DuelsList.tsx` — gating : "Connect to Play" si non authentifié
- [x] Modifier `GamePage.tsx` — useWallet hook, props auth au Sidebar
- [x] Ajouter constantes blockchain dans `constants.ts`

### Fichiers créés/modifiés
| Fichier | Action |
|---|---|
| `src/components/PrivyClientProvider.tsx` | **Créé** — Provider Privy avec config MegaETH testnet |
| `src/hooks/useWallet.ts` | **Créé** — Hook auth + balance USDM |
| `src/app/layout.tsx` | Modifié — Ajout PrivyClientProvider |
| `src/components/Sidebar.tsx` | Modifié — Vrai login/logout + balance |
| `src/components/DuelsList.tsx` | Modifié — Gating authenticated |
| `src/components/GamePage.tsx` | Modifié — useWallet integration |
| `src/hooks/useGameLoop.ts` | Modifié — Suppression mock connected state |
| `src/lib/constants.ts` | Modifié — Adresses contracts + ABI ERC20 |

---

## Phase 4 — Intégration Frontend ↔ Blockchain

### Objectif
Remplacer les mock data par des données on-chain réelles.

### Tâches

- [ ] Remplacer `MOCK_DUELS` par des lectures on-chain
  - `useContractRead` pour `getOpenDuels()`
  - Polling ou events pour mise à jour

- [ ] Connecter `doBlink()` à la blockchain
  - Chaque blink → `recordBlink(duelId)` via Pimlico (gasless)
  - Les toasts affichent le vrai hash TX

- [ ] Connecter `launch()` → `createDuel()` on-chain
  - Envoyer le stake avec la transaction
  - Attendre la confirmation avant de démarrer

- [ ] Connecter le challenge → `challengeDuel()` on-chain
  - À la fin des 30s, appeler `settleDuel()`
  - Afficher le résultat réel (gains/pertes)

- [ ] Remplacer `MOCK_LEADERBOARD` par des données on-chain
  - Lire les events `BlinkRecorded` pour calculer les totaux
  - Tri par nombre de blinks total

### Migration mock → réel (fichier par fichier)

| Fichier | Actuellement | Après intégration |
|---|---|---|
| `mockData.ts` | Données hardcodées | Supprimé |
| `useTxToasts.ts` | Hash aléatoires | Vrais hash TX MegaETH |
| `useGameLoop.ts` | Score local | Score envoyé on-chain |
| `DuelsList.tsx` | `MOCK_DUELS` | `useContractRead()` |
| `Leaderboard.tsx` | `MOCK_LEADERBOARD` | Events on-chain |
| `Sidebar.tsx` | Bouton "Connect" toggle | Privy login réel |

---

## Phase 5 — Real-time & Social (optionnel)

### Objectif
Live feed des blinks des autres joueurs + intégrations sociales.

### Tâches

- [ ] **WebSocket live feed** (Pusher ou SSE)
  - Voir les blinks des autres joueurs en temps réel
  - "X vient de blinker 42 fois !"

- [ ] **Twitter/X auth** (optionnel)
  - Lier son compte Twitter au profil
  - Afficher le pseudo au lieu de l'adresse wallet

- [ ] **Blink card partageable**
  - Générer une image avec le score
  - Partager sur Twitter avec un lien

### Inspiré de winky-starkzap
Ton pote a implémenté Pusher WebSockets + Twitter OAuth + blink card. On peut reprendre le même concept.

---

## Phase 6 — Déploiement

### Frontend → Vercel
```bash
# Depuis le repo GitHub
vercel deploy
```
- Variables d'env dans Vercel dashboard
- Domaine custom (winky-duel.xyz ou autre)

### Smart Contract → MegaETH Testnet puis Mainnet
```bash
npx hardhat run scripts/deploy.ts --network megaeth-testnet
# Puis après tests
npx hardhat run scripts/deploy.ts --network megaeth-mainnet
```

### Backend API (si nécessaire)
- Railway, Render, ou Vercel Serverless Functions
- Proxy paymaster Pimlico (clé API côté serveur)

---

## Déployer sur GitHub maintenant

```bash
# 1. Créer le repo sur GitHub (via gh CLI ou github.com)
gh repo create winky-duel --public --description "Blink to win. Every blink is a transaction on MegaETH."

# 2. Ajouter le remote et push
cd winky-duel
git remote add origin https://github.com/TON_USERNAME/winky-duel.git
git add .
git commit -m "feat: Phase 1 — Frontend with blink detection, game loop, and UI"
git push -u origin main
```

---

## Timeline estimée

| Phase | Durée estimée | Prérequis |
|---|---|---|
| Phase 1 ✅ | — | Fait |
| Phase 2 (Contract) | 2-3 jours | Connaissance Solidity basique |
| Phase 3 (Wallet) | 1-2 jours | Comptes Privy + Pimlico créés |
| Phase 4 (Intégration) | 2-3 jours | Phases 2+3 terminées |
| Phase 5 (Real-time) | 2-3 jours | Optionnel |
| Phase 6 (Deploy) | 1 jour | Tout terminé |
| **Total** | **~10 jours** | |
