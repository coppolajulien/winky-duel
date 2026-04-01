# Blinkit — Plan de développement

## Infos projet

| | |
|---|---|
| **Site** | [playblinkit.xyz](https://www.playblinkit.xyz) |
| **X** | [@playblinkit](https://x.com/playblinkit) |
| **Repo** | github.com/coppolajulien/winky-duel |
| **Chain** | MegaETH Mainnet (Chain ID 4326) |
| **Contract** | `0x745d7C26Dfc9aD77F8f384Ed089f40e2C356B2c3` |
| **Contract (testnet)** | `0xb4aB085840BA330Fc12c20A664Ad711E5bEa66a2` |
| **Token** | USDM (ERC-20) |
| **Rake** | 2.5% sur les gains |
| **Hosting** | Vercel (frontend + API) |
| **DB** | Upstash Redis |
| **Analytics** | Google Analytics (G-LV239T0EDB) |

---

## Statut actuel

| Phase | Statut | Description |
|---|---|---|
| Phase 1 — Frontend | ✅ Terminé | UI, blink detection (TensorFlow.js), game loop, slideshow |
| Phase 2 — Smart Contract | ✅ Terminé | WinkyDuel.sol — escrow, duels, rake, 46 tests |
| Phase 3 — Wallet Auth | ✅ Terminé | RainbowKit + wagmi (migration depuis Privy) |
| Phase 4 — Intégration | ✅ Terminé | Frontend ↔ blockchain, server-attested scores |
| Phase 5 — Déploiement | ✅ Terminé | Vercel + MegaETH Mainnet + domaine playblinkit.xyz |
| Phase 6 — Sécurité | ✅ Terminé | Signature wallet, anti-cheat, rate limiting, audit |
| Phase 7 — API publique | ✅ Terminé | Stats API pour intégrations tierces (MTRKR) |

---

## Architecture

### Stack technique
- **Frontend** : Next.js 16 + React + Tailwind CSS + shadcn/ui
- **Blink detection** : TensorFlow.js + MediaPipe Face Landmarks
- **Wallet** : RainbowKit + wagmi + viem
- **Backend** : Next.js API Routes (serverless)
- **DB** : Upstash Redis (sessions, rate limiting, invite codes, private duels)
- **Blockchain** : MegaETH (Solidity 0.8.24, Hardhat)
- **Noms** : .mega domain resolution (dotmega API)

### Game flow
1. Joueur connecte son wallet (RainbowKit)
2. Signe un message pour prouver la propriété du wallet
3. Serveur crée une session de jeu (Redis, TTL 5min)
4. Webcam activée → countdown 3-2-1 → 30s de blinks
5. Chaque blink envoyé au serveur (timestamp client + server)
6. À la fin : 8 validations anti-cheat côté serveur
7. Serveur signe le score (ECDSA EIP-191)
8. Score soumis on-chain via le smart contract
9. Settlement automatique (gagnant = plus de blinks)

### Sécurité API

| Endpoint | Auth | Rate limit |
|----------|------|------------|
| `POST /api/game/start` | Signature wallet | 30/min |
| `POST /api/game/blink` | SessionId 128-bit | 200/min |
| `POST /api/game/finish` | SessionId + lock atomique Redis | 30/min |
| `GET /api/stats` | Public | 20/min |
| `POST /api/private-duels` | Signature wallet + vérif creator on-chain | 10/min |
| `GET /api/private-duels` | Public (lecture) | — |
| `GET/POST /api/invite/codes` | Signature wallet admin | — |
| `POST /api/invite/validate` | Public (désactivé) | 10/min |

### Anti-cheat (8 validations serveur)
1. Durée de jeu minimum (25s)
2. Intervalles entre blinks (min 200ms client)
3. Timestamps monotoniques
4. Max blinks par seconde (7/s)
5. Pas de blinks après fin de partie
6. Count serveur = count client
7. Intervalles serveur (min 100ms réel)
8. Corrélation temps client/serveur (>50%)

---

## Features implémentées

- [x] Landing page avec vidéo slideshow
- [x] Détection de blinks en temps réel (webcam)
- [x] Duels PvP avec stakes USDM ($1 à $100)
- [x] Duels privés (liens partageables)
- [x] Page challenge `/duel/[id]` avec preview
- [x] Résolution .mega domains
- [x] Partage sur X (tweet + share card)
- [x] Copy image / copy link après un duel
- [x] Sidebar avec liste des duels, filtres par stake, historique
- [x] Admin dashboard (stats, duels, rake, withdraw)
- [x] Système d'invite codes (désactivé, réactivable)
- [x] Mobile gate (avec exception pour /duel/[id])
- [x] Sidebar désactivée pendant un duel actif, réactivée au résultat
- [x] Google Analytics
- [x] API publique `/api/stats` pour MTRKR
- [x] CORS activé sur l'API stats
- [x] Sons (countdown, go, overtake, win, lose, musique)
- [x] Leaderboard page
- [x] Profil X (@playblinkit) configuré

---

## Roadmap

### Court terme
- [ ] Bannière X (1500x500)
- [ ] Premier tweet + stratégie de contenu
- [ ] OG image dynamique par duel (preview quand on partage un lien)
- [ ] Leaderboard avec données on-chain (actuellement statique)

### Moyen terme
- [ ] Profil joueur `/player/[address]` (stats, historique, .mega)
- [ ] Referral system (invitations trackées)
- [ ] Notifications quand un duel est accepté
- [ ] Mobile support (reprendre le chantier)

### Long terme
- [ ] Tournois / brackets
- [ ] Anti-cheat renforcé (video proof, ZK)
- [ ] Multi-chain (si pertinent)

---

## Smart Contract

### WinkyDuel.sol
- **Fonctions** : `createDuel`, `submitScore`, `cancelDuel`, `withdrawRake`
- **Score attesté** : le serveur signe le score, le contrat vérifie la signature
- **Rake** : 2.5% prélevé sur les gains (configurable)
- **Nonces** : anti-replay par joueur
- **Trusted signer** : adresse du serveur vérifiée on-chain

### Déploiements
| Réseau | Adresse | Chain ID |
|--------|---------|----------|
| MegaETH Mainnet | `0x745d7C26Dfc9aD77F8f384Ed089f40e2C356B2c3` | 4326 |
| MegaETH Testnet | `0xb4aB085840BA330Fc12c20A664Ad711E5bEa66a2` | 6343 |
