# 0005 · Keep Watch controls and appearance shared

Status: Accepted

The Watch chrome follows the site’s Light, Dark, or System preference. The calculator keeps the same LCD colors and physical controls in every theme. Captions overlay the lower scene rather than changing its size, and CC controls captions whether or not narration is available. The compact pacing selector changes teaching holds, not recorded speech. Put essential guidance alongside the action it explains; production status, source notes and repeated caveats do not belong beneath the player. This keeps a learner’s attention on one demonstration and avoids fixing the same visual behavior separately on every lesson. Handset keys is the deliberate framing exception: it starts in Full calculator to teach where buttons are, but does not change the learner’s preference elsewhere.

Use one implementation for new and migrated lessons. Older players can adopt a tested common compatibility style during migration; do not write another custom player. See [ADR 0004](0004-standard-watch-template.md), the [player contract](../calculator-skills/PLAYER-CONTRACT.md) and the [glossary](../../GLOSSARY.md).
