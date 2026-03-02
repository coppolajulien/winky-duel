import type { Duel, LeaderboardEntry } from "./types";

export const MOCK_DUELS: Duel[] = [
  { id: "0x3a1f", creator: "0x7aB3...c92F", stake: 5, score: 28, time: "2m" },
  { id: "0xb72e", creator: "0x1De8...44aB", stake: 10, score: 35, time: "5m" },
  { id: "0x91c4", creator: "0xfA20...8e1C", stake: 1, score: 19, time: "8m" },
  { id: "0xe5a8", creator: "0x44cD...b3F7", stake: 25, score: 42, time: "12m" },
  { id: "0x2d09", creator: "0x8bE1...2a6D", stake: 5, score: 31, time: "15m" },
  { id: "0xf31b", creator: "0xC7a9...19eF", stake: 1, score: 22, time: "18m" },
  { id: "0x6c87", creator: "0x3fD2...c8A1", stake: 50, score: 39, time: "22m" },
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { r: 1, addr: "0x7aB3...c92F", blinks: 1847, wins: 23, earn: 142.5 },
  { r: 2, addr: "0xfA20...8e1C", blinks: 1623, wins: 19, earn: 98.75 },
  { r: 3, addr: "0x1De8...44aB", blinks: 1580, wins: 17, earn: 87.2 },
  { r: 4, addr: "0x44cD...b3F7", blinks: 1402, wins: 15, earn: 65.0 },
  { r: 5, addr: "0x8bE1...2a6D", blinks: 1295, wins: 12, earn: 43.5 },
  { r: 6, addr: "0xC7a9...19eF", blinks: 1188, wins: 11, earn: 38.0 },
];
