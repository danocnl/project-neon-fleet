# Tag Dictionary — Project Neon Fleet

All tags across 5 categories. Each entry shows: description, per-tag mechanic, and key interactions.

---

## [SHIP] Tags

### DEFENSE

**HULL**
Raw physical hit points of the vessel.
Each tag: +500 HP. Applied after armor reduction.
- × ARMOR — Armor reduces incoming damage before it reaches hull, making each HP point more effective.
- × REPAIR_RATE — Passive repair restores hull over time; larger pools benefit more from sustained repair.
- × NANITE — Nanite swarms target hull for restoration; larger pools absorb more nanite repair.

**ARMOR**
Flat percentage reduction to incoming physical and kinetic damage.
Each tag: +4% damage reduction, applied multiplicatively. Hard cap 60%.
- × HULL — Armor amplifies effective value of every hull point.
- × CORROSIVE — Corrosive attacks temporarily reduce armor %, lowering this tag's effectiveness.
- × COMPRESSION — Armor reduces collision damage from compressed enemy clusters.

**SHIELD_MAX**
Maximum energy shield capacity.
Each tag: +300 SP. Shields absorb damage before hull.
- × SHIELD_REGEN — Larger pools take longer to refill; regen rate must scale with shield max.
- × SHIELD_DELAY — High shield max is wasted if delay prevents regen from starting promptly.
- × VOLTAGE — Larger shield pools generate more power under fire for Hyper-Conductor builds.

**SHIELD_REGEN**
Rate at which shields restore when not taking damage.
Each tag: +20 SP/s.
- × SHIELD_DELAY — Regen rate is irrelevant until delay expires; reduce delay to unlock this tag's value.
- × COOLDOWN — CDR on shield abilities pairs with fast regen for rapid recovery cycles.
- × ON_SHIELD_DROP — Fast regen means ON_SHIELD_DROP triggers fire more frequently.

**SHIELD_DELAY**
Time before shield regen begins after taking damage.
Each tag: -0.3s delay. Minimum 0.5s.
- × SHIELD_REGEN — Lowering delay unlocks the value of high regen.
- × PHASE — Phase state blocks incoming damage, resetting delay and allowing regen to start sooner.
- × EVASION — Dodging hits avoids triggering delay, keeping regen active longer.

---

### MOBILITY

**TOP_SPEED**
Maximum forward velocity.
Each tag: +30 u/s.
- × ACCELERATION — Higher top speed is only usable if acceleration can reach it in time.
- × MASS — Mass × velocity at impact determines collision damage with IMPACT_DRIVE.
- × EVASION — Speed and evasion together make a ship hard to hit; each reinforces the other.

**ACCELERATION**
Rate at which top speed is reached.
Each tag: +25 u/s².
- × TOP_SPEED — Determines how quickly top speed is reached and how responsive direction changes feel.
- × BLINK — High acceleration lets the ship exploit a blink repositioning immediately.
- × MASS — Higher mass reduces acceleration's effectiveness; heavy ships need more tags.

**TURN_SPEED**
Angular handling and rotation speed.
Each tag: +20 °/s.
- × EVASION — Turn speed and evasion provide complementary defensive layers.
- × FRONTAL_ARC — Higher turn speed makes frontal-arc weapons easier to aim.
- × MASS — High mass penalises turn speed; extra tags help compensate on heavier hulls.

**EVASION**
Percentage chance to completely dodge an incoming hit.
Each tag: +3% dodge chance. Hard cap 45%. Successful dodge prevents all damage from that hit.
- × PHASE — Evasion tags count toward unlocking phase-linked upgrade paths.
- × ON_SHIELD_DROP — Evasion reduces frequency of shield-drop events, making triggers more deliberate.
- × BLINK — A near-lethal dodge can be followed immediately by a blink to reposition.

**MASS**
Vessel mass affecting momentum drift and collision physics.
Each tag: +1 mass unit. Increases collision damage dealt; reduces turn responsiveness.
- × TOP_SPEED — Mass × velocity at impact determines collision damage output.
- × COMPRESSION — More mass means higher impact damage when colliding with compressed clusters.
- × TURN_SPEED — Each mass tag slightly reduces effective turn speed.

---

### CAPACITY

**SLOT_SMALL** — Each tag: +1 small hardpoint.
- × RATE_OF_FIRE — Small slots host rapid-fire weapons; ROF tags multiply their output.
- × DRONE_COUNT — Small slots can house drone launchers for multiple drone types.

**SLOT_MEDIUM** — Each tag: +1 medium hardpoint.
- × ENERGY_GRID — Medium weapons draw moderate energy; more slots need a larger grid.
- × HEAT_GEN — Multiple medium weapons generate significant heat; manage with HEAT_DISSIPATION.

**SLOT_LARGE** — Each tag: +1 large hardpoint.
- × ENERGY_GRID — Large weapons are high energy consumers; insufficient grid causes fire rate drops.
- × BLAST_RADIUS — Large slots host explosive weapons; BLAST_RADIUS scales their AoE.

**SLOT_XL** — Each tag: +1 XL hardpoint. XL weapons are the highest single-slot damage in the game.
- × ENERGY_GRID — XL weapons are extreme energy draws; dedicated grid builds are required.
- × PIERCE — XL weapons with pierce tags cut through entire enemy formations in one shot.

**CARGO_CAPACITY** — Each tag: +20 cargo units.
- × SALVAGE — Debris resources consume cargo; higher capacity prevents overflow loss.
- × ON_KILL — Kill triggers that grant resources benefit from larger cargo pools.

---

### UTILITY

**HEAT_DISSIPATION**
Rate at which weapon and engine heat is cooled.
Each tag: +8 heat/s cooling rate.
- × HEAT_GEN — Net heat = HEAT_GEN minus HEAT_DISSIPATION. Surplus dissipation prevents overheat lockout.
- × VOLTAGE — Controls the heat-to-VOLTAGE conversion rate in Hyper-Conductor builds.
- × ON_OVERHEAT — Lower dissipation makes ON_OVERHEAT triggers fire more frequently in deliberate overheat builds.

**ENERGY_GRID**
Total power capacity available to run modules and weapons.
Each tag: +40 energy capacity. Weapons draw from this pool; when empty, fire rate drops.
- × ENERGY_COST — Lower cost per shot and a larger grid dramatically extend sustained fire time.
- × OVERCLOCK — Overclock burns energy reserves; a larger grid extends overclock uptime.
- × RESOURCE_FEED — Only useful if your own grid has surplus to share with an ally.

**REPAIR_RATE**
Passive hull restoration rate.
Each tag: +5 HP/s.
- × HULL — Higher hull pools take longer to fully restore; both must scale together.
- × NANITE — Nanite swarms add burst restoration on top of passive repair rate.
- × REPAIR_SWARM — Repair swarm constructs add additional output that stacks with base REPAIR_RATE.

---

## [WEAPON] Tags

### TYPE

**ENERGY** — Laser and plasma weapons. Each tag: +8% energy weapon damage.
- × MIRROR — Reflected shots inherit ENERGY tag bonuses.
- × PRISM — Each split beam copy carries full ENERGY bonuses.
- × EMP — ENERGY tags boost base damage; EMP tags extend disable duration on the same shot.

**KINETIC** — Ballistic and railgun weapons. Each tag: +8% kinetic weapon damage.
- × PIERCE — Kinetic rounds with pierce tags punch through multiple hulls.
- × ARMOR — Kinetic damage is reduced by ARMOR; strip armor with CORROSIVE first.

**EXPLOSIVE** — Missile and AoE blast weapons. Each tag: +8% explosive damage.
- × BLAST_RADIUS — Core scaling stat for explosive builds — damage and coverage.
- × COMPRESSION — Explosives inside a compressed cluster hit all targets simultaneously.
- × GRAVITY — Singularity pulls enemies into the blast zone before detonation.

**PSIONIC** — Bypass damage that ignores shields and armor. Each tag: +10% bypass.
- × TETHER — Psionic bypass properties propagate through tether links.
- × DAMAGE_SHARE — Damage shared along links also inherits bypass.

**BIOLOGICAL** — Nanite and corrosion damage. Each tag: +6 corrosion DPS stacked on target.
- × NANITE — NANITE tags increase biological DPS on afflicted targets.
- × INFESTATION — Infestation spreads biological effects to nearby enemies from a dying host.
- × DOT_DURATION — Extends biological DOT stacks for dramatically higher total damage.

**CORROSIVE** — Armor stripping. Each tag: -3% target armor per stack, max 5 stacks.
- × KINETIC — CORROSIVE strips armor so kinetic damage bypasses reduction — standard combo.
- × BIOLOGICAL — Both apply from the same hit and stack independently.
- × ON_HIT — Each stack application fires as an individual ON_HIT event.

---

### STATS

**RATE_OF_FIRE** — Each tag: +12% fire rate for all weapons.
- × HEAT_GEN — Higher fire rate increases total heat per second.
- × ENERGY_COST — More shots per second drains the grid faster; offset with cost reduction.
- × ON_HIT — More shots equals more ON_HIT trigger opportunities per second.

**RELOAD_SPEED** — Each tag: -15% reload time.
- × AMMO_CAPACITY — Larger magazines reduce reload frequency; faster reloads cut the mandatory gaps.
- × COOLDOWN — COOLDOWN reduces ability cooldowns; RELOAD_SPEED covers weapon cycle gaps.

**AMMO_CAPACITY** — Each tag: +2 shots per magazine.
- × RELOAD_SPEED — More ammo delays reloads; faster reloads recover the gap.
- × RATE_OF_FIRE — Higher fire rates burn through magazines faster; capacity must scale with ROF.

**ENERGY_COST** — Each tag: -8% energy cost per shot.
- × ENERGY_GRID — Lower cost + larger grid dramatically extend sustained fire time.
- × OVERCLOCK — Lower shot costs preserve grid for overclock burst windows.

**HEAT_GEN** — Each tag: +15% heat output per shot. Intentional in Hyper-Conductor builds.
- × HEAT_DISSIPATION — Net heat balance determines overheat frequency.
- × VOLTAGE — Heat generated is the fuel for VOLTAGE damage output.
- × ON_OVERHEAT — Stacking HEAT_GEN enables more frequent ON_OVERHEAT triggers.

---

### BEHAVIOR

**VELOCITY** — Each tag: +15% projectile speed.
- × RANGE — Faster projectiles reach max range before expiring.
- × PIERCE — High velocity piercing shots reduce the window for targets to leave the path.

**ACCURACY** — Each tag: -20% spread angle.
- × RANGE — Higher accuracy at range ensures shots hit rather than diverging.
- × RATE_OF_FIRE — High ROF + high spread creates area coverage; accuracy focuses damage on single targets.

**RANGE** — Each tag: +15% weapon range.
- × LONG_RANGE_TARGETING — Anaconda's special tag adds 40% base range; RANGE tags stack on top.
- × REFLECTION — Reflected beams inherit the original weapon's range.

**BLAST_RADIUS** — Each tag: +20% AoE radius.
- × COMPRESSION — Compressed clusters inside a large blast take full damage simultaneously.
- × GRAVITY — Singularity radius scales from BLAST_RADIUS tags.
- × EXPLOSIVE — EXPLOSIVE boosts base damage; BLAST_RADIUS scales how many targets that damage hits.

**PIERCE** — Each tag: +1 pierce count (enemy ships a shot passes through).
- × TETHER — Piercing shots apply a tether to each enemy they pass through.
- × CORROSIVE — Piercing corrosive shots apply armor-strip stacks to every enemy in the line.
- × COMPRESSION — Compressed clusters maximise pierce value — one shot hits all of them.

**RICOCHET** — Each tag: +1 bounce count. Each bounce retains 70% of previous hit's damage.
- × MIRROR — Mirrors redirect ricochets at new angles — ricochet + mirror creates multi-target geometry.
- × DEBRIS_FIELD — Debris fields act as ricochet surfaces, turning barriers into offensive geometry.
- × PRISM — After a prism split, each copy can independently ricochet.

---

### STATUS

**BURN** — Each tag: +12 thermal DPS, +0.5s burn duration.
- × HEAT_GEN — Burning enemies radiate heat, feeding Hyper-Conductor conversion at close range.
- × DOT_DURATION — Extends burn duration, multiplying total damage per application.
- × INFESTATION — Infestation spreading through a burning enemy carries burn status to the next host.

**FREEZE** — Each tag: -10% enemy speed, +0.3s freeze duration.
- × GRAVITY — Frozen enemies cannot drift out of a singularity pull.
- × COMPRESSION — Freeze slows enemies trying to scatter after compression ends.
- × PIERCE — A freezing piercing shot can slow an entire column in one pass.

**EMP** — Each tag: +0.8s disable duration. Disabled enemies cannot regen shields or fire.
- × VOLTAGE — EMP drops shields; VOLTAGE then deals unabsorbed direct damage.
- × TETHER — EMP applied to a tethered target propagates the disable along the chain.
- × ON_SHIELD_DROP — EMP reliably triggers ON_SHIELD_DROP for reactive builds.

**CRITICAL_CHANCE** — Each tag: +5% crit chance. Crits deal 2× base damage.
- × ON_CRIT — More crits trigger ON_CRIT logic modules more often.
- × DAMAGE_SHARE — Critical hits that echo via DAMAGE_SHARE apply the crit multiplier to all linked targets.
- × TEMPORAL_ECHO — A crit echoed by TEMPORAL_ECHO duplicates the damage burst after a delay.

**DOT_DURATION** — Each tag: +0.5s to all active status effect durations.
- × BURN — Burn duration extension has the highest DPS return per second added.
- × INFESTATION — Longer status durations give infestation more time to spread before host death.
- × CORROSIVE — Extended corrosive stacks allow more subsequent hits to benefit from reduced armor.

---

## [CONSTRUCT] Tags

### SPECS

**DRONE_COUNT** — Each tag: +1 active drone cap.
- × DRONE_DAMAGE — More drones with higher damage scales total DPS multiplicatively.
- × REPAIR_SWARM — More drones in repair mode provide higher total HP/s to the team.
- × NANITE — Each active nanite drone delivers payload independently.

**DRONE_HULL** — Each tag: +150 HP to all active drones.
- × RESPAWN_RATE — Tankier drones survive longer, reducing respawn frequency.
- × KAMIKAZE — Kamikaze drones don't benefit from hull — these tags are mutually exclusive in efficient builds.

**DRONE_SPEED** — Each tag: +20% drone movement speed.
- × KAMIKAZE — Faster kamikaze drones close distance before targets can evade.
- × REPAIR_SWARM — Faster repair drones reach damaged allies sooner.

**DRONE_DAMAGE** — Each tag: +15% drone weapon damage.
- × DRONE_COUNT — Damage scales per drone; more drones multiply benefit of each tag.
- × TARGETING_BEACON — Beaconed targets receive bonus damage from all sources including drones.

**RESPAWN_RATE** — Each tag: -1.5s respawn cooldown.
- × DRONE_COUNT — Large fleet with fast respawn maintains near-maximum active count under fire.
- × ON_KILL — ON_KILL triggers can reset respawn cooldowns with the right logic module.

---

### BEHAVIOR

**ORBITAL** — Each tag: +10% orbital radius, +5% collision damage from orbiting constructs.
- × MASS — Higher ship mass at the orbital center increases impact force.
- × DEBRIS_FIELD — Debris can orbit the ship, combining ORBITAL behavior with physical barriers.

**KAMIKAZE** — Each tag: +40% detonation damage.
- × DRONE_SPEED — Faster kamikaze drones close distance before targets evade.
- × BLAST_RADIUS — BLAST_RADIUS extends the explosion area per detonation.
- × RESPAWN_RATE — Fast respawn maintains kamikaze supply for continuous waves.

**POINT_DEFENSE** — Each tag: +15% interception accuracy.
- × DRONE_SPEED — Faster drones intercept faster-moving projectiles reliably.
- × SHIELD_MAX — Point defense reduces incoming damage that would drain shields — both protect the hull.

**REPAIR_SWARM** — Each tag: +8 HP/s team repair from all active repair constructs.
- × DRONE_COUNT — More repair drones means more simultaneous repair beams.
- × REPAIR_RATE — REPAIR_SWARM stacks additively with base REPAIR_RATE.
- × NANITE — Nanite swarms and repair drones together create layered restoration: burst + sustained.

**TARGETING_BEACON** — Each tag: +10% bonus damage allies deal to beaconed targets.
- × DAMAGE_SHARE — Beaconed targets take bonus damage; DAMAGE_SHARE echoes that bonus to tethered enemies.
- × TETHER — A tethered, beaconed target creates a focus-fire node where all damage is amplified and echoed.

---

## [SPECIALIZATION] Tags

### SPATIAL

**GRAVITY** — Each tag: +15% pull force, +10% pull radius.
- × COMPRESSION — GRAVITY pulls enemies in; COMPRESSION holds them dense. Sequential for maximum effect.
- × SINGULARITY — GRAVITY tags amplify singularity pull force and field radius simultaneously.
- × BLAST_RADIUS — Singularity radius scales from BLAST_RADIUS tags.

**SINGULARITY** — Each tag: +0.8s duration, +12% damage.
- × GRAVITY — GRAVITY amplifies pull force and field size.
- × COMPRESSION — COMPRESSION holds enemies dense after the singularity expires.
- × EXPLOSIVE — Detonating inside an active singularity hits all compressed enemies simultaneously.

**PULL_FORCE** — Each tag: +20 force units to pull strength.
- × MASS — Heavier enemies resist pull; higher PULL_FORCE overcomes resistance.
- × FREEZE — Frozen enemies resist pull less — FREEZE and PULL_FORCE combine for guaranteed clustering.

**COMPRESSION** — Each tag: +15% compression damage bonus (denser cluster = more bonus damage).
- × GRAVITY — GRAVITY creates the cluster; COMPRESSION keeps it dense and punishes it.
- × EXPLOSIVE — Explosives inside a compressed cluster hit every target for full blast damage.
- × PIERCE — Piercing shots through a compressed cluster hit every enemy at full damage.

**DISPLACEMENT** — Each tag: +15% knockback force magnitude.
- × MASS — Higher-mass enemies resist displacement.
- × DEBRIS_FIELD — Displaced enemies collide with debris fields, taking additional impact damage.

---

### CHRONO

**CHRONO** — Each tag: +8% time distortion field strength.
- × EXECUTION_SPEED — CHRONO scales field strength; EXECUTION_SPEED targets automation loop tick rates within it.
- × AURA_RADIUS — AURA_RADIUS expands how far the CHRONO distortion field reaches.
- × FREQUENCY — FREQUENCY increases how often the CHRONO field pulses its effect.

**COOLDOWN** — Each tag: -6% to all ability cooldowns.
- × PHASE — Phase state cooldown reduction enables more frequent invulnerability windows.
- × BLINK — Faster blink cooldowns enable rapid repositioning in succession.
- × SINGULARITY — Singularity CDR allows more aggressive gravity cluster deployment.

**EXECUTION_SPEED** — Each tag: +10% automation loop tick rate.
- × CHRONO — CHRONO field strength amplifies the radius in which EXECUTION_SPEED benefits apply.
- × FREQUENCY — FREQUENCY and EXECUTION_SPEED both accelerate loop timing on different systems — they stack.
- × ON_HIT — Faster execution means ON_HIT triggers fire sooner after each hit event.

**FREQUENCY** — Each tag: +12% pulse frequency of all periodic effects.
- × HARMONIC — More frequent pulses stack HARMONIC faster, accelerating the exponential multiplier.
- × REPAIR_SWARM — Higher frequency repair pulses restore more HP per second.
- × BROADCAST — BROADCAST pulses buffs at the FREQUENCY tick rate — higher frequency = more consistent buff uptime.

**AURA_RADIUS** — Each tag: +25u to all aura-based effect radii.
- × CHRONO — Expands the zone where CHRONO distortion benefits apply.
- × BROADCAST — BROADCAST range scales with AURA_RADIUS for wider buff coverage.
- × DEBRIS_FIELD — Extends the coverage zone of deployed debris fields.

**TEMPORAL_ECHO** — Each tag: +12% chance for any triggered effect to duplicate 0.8s later.
- × ON_KILL — Kill effects duplicated by TEMPORAL_ECHO grant a second proc of all on-kill rewards.
- × CRITICAL_CHANCE — Crit damage bursts echoed by TEMPORAL_ECHO repeat on the same target.
- × DAMAGE_SHARE — Echoed damage events also trigger DAMAGE_SHARE propagation.

---

### CO-OP

**TETHER** — Each tag: +1 simultaneous tether link, +15% tether range.
- × CHAIN — TETHER establishes the link; CHAIN determines how many times effects jump along the network.
- × DAMAGE_SHARE — All targets linked by TETHER share damage dealt to any single one of them.
- × PIERCE — Piercing shots apply a fresh tether link to each enemy they pass through.

**DAMAGE_SHARE** — Each tag: +8% of damage dealt to one tethered target echoes to every other linked target.
- × TETHER — DAMAGE_SHARE requires active tether links to propagate.
- × CRITICAL_CHANCE — A crit's multiplied damage also echoes — DAMAGE_SHARE amplifies the value of every crit.
- × PSIONIC — Psionic bypass is inherited by echoed damage.

**BROADCAST** — Each tag: +20u broadcast range, +1 additional buff type that can be shared.
- × AURA_RADIUS — Both extend range — they stack for maximum coverage.
- × AMPLIFICATION — AMPLIFICATION multiplies the value of the broadcasted buff.
- × HARMONIC — HARMONIC stacks can be broadcast to give allies the exponential multiplier benefit.

**RESOURCE_FEED** — Each tag: +12% of excess heat or energy transferred to nearest ally per second.
- × ENERGY_GRID — A large grid creates surplus that RESOURCE_FEED can share.
- × VOLTAGE — Mamba feeding heat to a Hyper-Conductor ally directly charges VOLTAGE output.
- × HEAT_DISSIPATION — Ships with excess dissipation can offload heat to fuel a partner's damage cycle.

**AMPLIFICATION** — Each tag: +8% stat multiplier applied to all allies inside the aura.
- × BROADCAST — BROADCAST range determines who receives AMPLIFICATION.
- × HARMONIC — HARMONIC stacks multiply the AMPLIFICATION output exponentially at high counts.
- × FREQUENCY — The amplification aura pulses at FREQUENCY rate — higher frequency = more consistent uptime.

**CHAIN** — Each tag: +1 chain jump, +10% damage retention per jump (base retention 60%).
- × TETHER — CHAIN requires active tether links to jump along.
- × EMP — EMP chaining along tether links disables an entire tethered group simultaneously.
- × DAMAGE_SHARE — CHAIN and DAMAGE_SHARE create two simultaneous propagation systems on the same network.

---

### EXOTIC

**PHASE** — Each tag: +0.3s phase duration, -0.8s phase cooldown.
- × INVULNERABILITY — PHASE shifts the hitbox; INVULNERABILITY ensures complete immunity during the window.
- × BLINK — A blink can be performed during an active phase state — repositioning while untouchable.
- × EVASION — High evasion reduces how often phase is needed defensively, enabling more offensive use.

**INVULNERABILITY** — Each tag: +0.2s invulnerability window.
- × PHASE — PHASE enables the hitbox shift; INVULNERABILITY ensures no damage source can reach the ship.
- × COOLDOWN — CDR increases how often invulnerability windows can be entered.
- × ON_SHIELD_DROP — Invulnerability on shield drop provides a safe regen window.

**NANITE** — Each tag: +2 nanites deployed per pulse.
- × INFESTATION — NANITE deploys the swarm; INFESTATION determines how many targets it spreads to on host death.
- × BIOLOGICAL — Each nanite carries a biological payload — BIOLOGICAL increases damage on contact.
- × REPAIR_SWARM — Nanites in repair mode stack with REPAIR_SWARM for layered hull restoration.

**SALVAGE** — Each tag: +15% debris collected per enemy destroyed.
- × DEBRIS_FIELD — Collected SALVAGE fuels DEBRIS_FIELD deployments.
- × RICOCHET — Deployed debris acts as a ricochet surface for offensive geometry.
- × ORBITAL — Salvaged debris can orbit the ship as a rotating protective ring.

**REFLECTION** — Each tag: +12% reflected damage multiplier.
- × MIRROR — MIRROR redirects reflections at chosen angles; REFLECTION determines their damage.
- × SHIELD_MAX — Shields absorb incoming shots; REFLECTION returns damage even from fully-shielded hits.
- × ENERGY — Reflected energy beams inherit ENERGY bonuses from the defender's build.

**MIRROR** — Each tag: +1 active mirror prism deployed.
- × PRISM — MIRROR bounces beams; PRISM splits them. A bounced beam can then be split.
- × RICOCHET — Projectiles bouncing off mirrors consume one ricochet count, allowing further bounces.
- × REFLECTION — Mirrors amplify reflections by directing returned fire precisely.

**INFESTATION** — Each tag: infestation spreads to +1 additional target on host death.
- × NANITE — NANITE is the payload; INFESTATION is the spread mechanic.
- × ON_KILL — Kill events trigger infestation spread — ON_KILL and INFESTATION chain for cascading effects.
- × BIOLOGICAL — Biological status carried by nanites spreads to each new infestation target.

**BLINK** — Each tag: -0.5s blink cooldown, +20u blink range.
- × PHASE — Blinking during active phase allows repositioning while untouchable.
- × COOLDOWN — COOLDOWN tags stack with BLINK's own CDR for very frequent repositioning.
- × ACCELERATION — High acceleration exploits blink repositioning immediately without losing momentum.

**PRISM** — Each tag: +1 beam split. Each split deals 60% of parent beam damage.
- × MIRROR — Mirror and prism chain: bounce then split, or split then bounce.
- × RICOCHET — Each split copy can independently ricochet, multiplying coverage geometrically.
- × ENERGY — All copies inherit ENERGY type damage bonuses from the parent beam.

**DEBRIS_FIELD** — Each tag: +1 debris piece deployed, +15% barrier HP.
- × SALVAGE — SALVAGE collection rate determines the debris available to deploy.
- × RICOCHET — Projectiles ricochet off debris fields onto new targets.
- × AURA_RADIUS — Extends the coverage zone of deployed debris fields.

---

### CONDUCTOR

**VOLTAGE** — Each tag: +15% electrical damage output. VOLTAGE deals direct damage; EMP disables.
- × HEAT_GEN — Heat generated by weapons is the raw fuel for VOLTAGE conversion.
- × EMP — EMP drops shields; VOLTAGE then deals unabsorbed direct electrical damage.
- × OVERCLOCK — OVERCLOCK burns energy to temporarily spike VOLTAGE output above baseline.

**OVERCLOCK** — Each tag: +8% burst magnitude, +0.3s burst duration.
- × ENERGY_GRID — A larger grid sustains longer and more frequent overclock windows.
- × VOLTAGE — OVERCLOCK spikes VOLTAGE output during the burst window — these two tags define Hyper-Conductor's peak damage.
- × COOLDOWN — CDR lets overclock cycles fire more frequently, extending total burst uptime.

---

### RESONANCE

**HARMONIC** — Each tag: +6% per-stack resonance multiplier (exponential at high stacks).
At 5 stacks: ~1.34× all aura effects. At 10 stacks: ~1.79×.
- × FREQUENCY — Higher pulse frequency accumulates HARMONIC stacks faster.
- × AMPLIFICATION — HARMONIC stacks multiply the AMPLIFICATION output — compounding team buff value.
- × BROADCAST — Sharing HARMONIC stacks via BROADCAST gives allies the exponential multiplier directly.

---

## [LOGIC] Tags

### CONDITIONAL

**ON_HIT** — Each tag: +1 additional logic module that can execute simultaneously on this event.
- × RATE_OF_FIRE — Higher fire rate = more ON_HIT events per second, accelerating all trigger effects.
- × CHAIN — Chain propagates ON_HIT effects along tether networks — one hit triggers the chain.
- × CORROSIVE — Each corrosive stack application fires as an individual ON_HIT event.

**ON_CRIT** — Each tag: +15% bonus effect magnitude on crit-triggered modules.
- × CRITICAL_CHANCE — More frequent crits = more ON_CRIT trigger opportunities.
- × DAMAGE_SHARE — Critical hits echoed via DAMAGE_SHARE also fire ON_CRIT on the echo target.
- × TEMPORAL_ECHO — TEMPORAL_ECHO duplicating a crit fires ON_CRIT a second time after the delay.

**ON_KILL** — Each tag: +1 logic module triggers on kill, +8% kill proc duration.
- × INFESTATION — Kill events trigger infestation spread — cascading nanite propagation.
- × SALVAGE — ON_KILL is when debris is generated; kill rate directly feeds Scrap Salvager collection.
- × TEMPORAL_ECHO — A kill effect duplicated by TEMPORAL_ECHO fires twice: on kill, then 0.8s later.

**ON_SHIELD_DROP** — Each tag: +1 additional logic module triggers when shields reach 0.
- × PHASE — Phase Weaver triggering on shield drop creates an invulnerability window exactly when needed.
- × EMP — EMP reliably forces shields to zero, creating predictable trigger windows.
- × SHIELD_REGEN — Fast regen after a drop resets the condition quickly, enabling repeated cycling.

**ON_OVERHEAT** — Each tag: -5s cooldown on heat-triggered abilities.
- × HEAT_GEN — Stacking HEAT_GEN intentionally reaches overheat faster for more frequent triggers.
- × VOLTAGE — ON_OVERHEAT is the primary discharge trigger for Hyper-Conductor VOLTAGE bursts.
- × HEAT_DISSIPATION — Deliberately limiting dissipation allows overheat to trigger on a controlled schedule.

---

### SPATIAL TRIGGERS

**IN_RANGE** — Each tag: +20u detection radius.
- × AURA_RADIUS — Both define spatial zones — expanding one often benefits the other in aura-trigger builds.
- × TETHER — IN_RANGE can automatically initiate a tether when a target enters the detection zone.

**BEHIND_ALLY** — Each tag: +12% bonus effect magnitude to modules triggered from behind-ally position.
- × RESOURCE_FEED — Positioned behind an ally, RESOURCE_FEED transfers at higher efficiency.
- × BROADCAST — Broadcast from behind-ally position benefits from positional bonus.

**FRONTAL_ARC** — Each tag: +15° frontal arc width. Base 90°, max 180°.
- × TURN_SPEED — Higher turn speed keeps targets inside the arc for trigger conditions.
- × MIRROR — Mirrors placed in the frontal arc redirect fire into a wide coverage zone.

**PROXIMITY** — Each tag: +15u proximity detection radius.
- × ORBITAL — Orbital constructs operate at close range — PROXIMITY triggers align naturally.
- × DEBRIS_FIELD — Proximity-triggered debris deployment creates reactive barrier placement.
- × COMPRESSION — Proximity triggers fire as a compressed cluster forms — useful for detonating area effects at peak density.

---

### TEAM TRIGGERS

**ALLY_LOW_HP** — Each tag: +5% HP threshold (triggers earlier). More tags = trigger fires sooner.
- × REPAIR_SWARM — ALLY_LOW_HP triggering repair swarm dispatch is the core sustain logic loop.
- × PHASE — Phase Weaver using ALLY_LOW_HP to trigger a team phase field saves allies from lethal damage.
- × RESOURCE_FEED — Emergency energy redirected to a low-HP ally provides resources for their defenses.

**ALLY_TARGETED** — Each tag: +1 ally that can simultaneously trigger this condition.
- × TETHER — When an ally is targeted, auto-tethering attackers redirects damage share back to them.
- × PHASE — Triggering phase when an ally is targeted provides temporary protection before shots land.

**TEAM_CLUSTER** — Each tag: +15u cluster detection radius (easier to maintain trigger condition).
- × HARMONIC — HARMONIC stacks accumulate faster when TEAM_CLUSTER is maintained — formation play rewards compound scaling.
- × BROADCAST — BROADCAST confirms both ships are in range to receive buffs simultaneously.
- × AMPLIFICATION — Clustered ships trigger amplification on each other — peak buff output requires tight formation.

---

## NEW TAGS — Weapons, Constructs, Drones & Radius

---

## [SHIP] — New Utility Tags

**PICKUP_RADIUS** — Each tag: +20u collection radius (base 40u). Ship and HARVESTER drones auto-collect dropped items within this range.
- × HARVESTER — Harvester drones use the ship's PICKUP_RADIUS as their autonomous collection range.
- × GLOBAL_RADIUS — GLOBAL_RADIUS amplifies PICKUP_RADIUS alongside all other radius effects.
- × SALVAGE — Extends debris collection range, feeding Scrap Salvager's DEBRIS_FIELD pool faster.

---

## [CONSTRUCT] — New Spec Tags

**DRONE_SHIELD** — Each tag: +100 shield points to all active drones. Absorbed before DRONE_HULL takes damage.
- × DRONE_HULL — Shield absorbs damage first; DRONE_HULL is the last line of defence.
- × SHIELD_DRONE — SHIELD_DRONE behavior generates and maintains this shield pool.
- × ON_SHIELD_DROP — Drone shield depletion can fire the parent ship's ON_SHIELD_DROP logic reactively.

**THREAT_LEVEL** — Each tag: +0.5 threat multiplier. At 5+ stacks most enemies prioritise the drone over the parent ship.
- × DECOY — DECOY behavior depends on high THREAT_LEVEL to reliably redirect enemy targeting.
- × DRONE_HULL — High-threat drones attract fire; DRONE_HULL must survive the attention.
- × DRONE_SHIELD — Shield pool extends how long a high-threat decoy can absorb incoming fire.

---

## [CONSTRUCT] — New Behavior Tags

**DECOY** — Each tag: +30u aggro radius, extends aggro persistence after taking a hit.
- × THREAT_LEVEL — Determines how effectively the decoy redirects enemy targeting.
- × KAMIKAZE — A DECOY that detonates when destroyed — sacrificial lure with a lethal farewell.
- × INFESTATION — When enemies destroy a DECOY, infestation triggers on the killer.
- × SALVAGE — Destroyed decoys generate debris, feeding Scrap Salvager builds.

**SHIELD_DRONE** — Each tag: +150 SP shield projection capacity.
- × DRONE_SHIELD — SHIELD_DRONE projects its DRONE_SHIELD pool as a barrier between ship and incoming fire.
- × ON_SHIELD_DROP — When the drone's shield depletes, the parent ship's ON_SHIELD_DROP logic fires.
- × INVULNERABILITY — Shield drone depletion can chain into a Phase Weaver invulnerability window.

**HARVESTER** — Each tag: +1 concurrent collection target, increased collection speed.
- × PICKUP_RADIUS — Uses ship's PICKUP_RADIUS as autonomous collection range.
- × SALVAGE — Collected debris feeds directly into Scrap Salvager's DEBRIS_FIELD pool.
- × RESOURCE_FEED — Energy resources collected feed back into the ship's grid.

**ESCORT** — Each tag: +100u escort assignment range.
- × REPAIR_SWARM — Escort with REPAIR_SWARM heals an ally rather than the parent ship.
- × BROADCAST — Escort drones deliver BROADCAST buffs to the assigned ally's position.
- × ALLY_LOW_HP — ALLY_LOW_HP trigger can reactively dispatch escorts to a damaged partner.

**MINE_LAYER** — Each tag: -1.5s mine deployment cooldown.
- × MINE — MINE_LAYER drones deploy MINE constructs at intervals.
- × PERSISTENCE — Deployed mines last longer, expanding area-denial windows.
- × GRAVITY — Mine-layer drones prioritise placing mines inside active graviton fields.

**MINE** — Each tag: +15u detection radius, +20 detonation damage.
- × BLAST_RADIUS — Detonation AoE scales with BLAST_RADIUS tags.
- × GLOBAL_RADIUS — Amplifies both detection radius and blast radius simultaneously.
- × COMPRESSION — Mines inside a compressed cluster deal bonus damage to densely packed enemies.
- × PERSISTENCE — Determines how long mines remain active before expiring.

**PERSISTENCE** — Each tag: +4s to lifespan of all deployed constructs (mines, prisms, debris, drones).
- × MINE — Mines last significantly longer, expanding area-denial coverage.
- × MIRROR — Vector Specialist prisms persist longer, making beam geometry more reliable.
- × DEBRIS_FIELD — Deployed debris barriers remain active longer.
- × SINGULARITY — Active singularities persist longer.

---

## [WEAPON] — New Behavior Tags

**BEAM** — Each tag: +10% continuous DPS, +8% beam length. Only type that interacts with MIRROR and PRISM.
- × MIRROR — BEAM weapons are redirected by deployed mirrors — foundation of Vector Specialist geometry.
- × PRISM — Beams split into copies at prisms. Only BEAM weapons interact with PRISM.
- × REFLECTION — BEAM weapons bounce back from REFLECTION armor toward the attacker.
- × ENERGY — ENERGY type bonuses compound with BEAM DPS — beam builds naturally stack both.

**PROJECTILE_COUNT** — Each tag: +1 simultaneous projectile per shot (shotgun / volley).
- × ACCURACY — Lower accuracy spreads projectiles into a wider cone.
- × SPLIT — Each projectile in a volley can independently split.
- × CHAIN — Each projectile in a volley chains independently to new targets.

**CHAIN** — Each tag: +1 chain jump, 70% damage retained per jump.
- × TETHER — Chain shots propagate along tether networks — Quantum Entangler's native projectile type.
- × DAMAGE_SHARE — Chain damage echoes to all tethered targets simultaneously.
- × COMPRESSION — Clustered enemies make chain jumps trivially reliable — COMPRESSION is a passive CHAIN amplifier.
- × EMP — A chaining EMP shot disables every enemy in the chain sequence in one pass.

**SPLIT** — Each tag: +1 split copy at 60% parent damage.
- × PIERCE — Each split copy pierces independently.
- × PRISM — Split copies hitting a prism are further split — exponential coverage.
- × COMPRESSION — Split projectiles into a compressed cluster hit every enemy simultaneously.
- × TEMPORAL_ECHO — Split copies echoed by TEMPORAL_ECHO double the copy count 0.8s after the shot.

**PULSE** — Each tag: +15% pulse base damage. Weapon radiates from ship rather than firing toward a target.
- × PULSE_RADIUS — Primary scaling stat for pulse weapons.
- × AURA_RADIUS — AURA_RADIUS also extends PULSE radius, connecting pulse weapons to class aura builds.
- × GLOBAL_RADIUS — Amplifies pulse reach alongside all other radius effects.
- × FREQUENCY — FREQUENCY reduces effective PULSE_INTERVAL — faster pulses.

**RETURN** — Boolean. Projectile returns to source after max range or chain completion. Source immune to own projectile. Return pass deals 80% damage.
- × PIERCE — Pierces targets on both outward and return passes — double pierce line.
- × CHAIN — Chains between targets on the way out and again on the way back.
- × RICOCHET — Return path also bounces off surfaces and prisms.
- × SPLIT — Split copies each return independently.

---

## [WEAPON] — New Stat Tags

**PASSIVE_DRAIN** — Energy drawn per second while weapon is active, independent of firing rate.
- × ENERGY_GRID — Larger grid sustains passive drain longer before browning out.
- × ENERGY_REGEN — Regen must exceed total passive drain to maintain sustained operation.
- × OVERCLOCK — Overclock burns additional energy on top of passive drain during burst windows.

**PASSIVE_HEAT** — Heat generated per second while weapon is running, independent of firing.
- × HEAT_DISSIPATION — Net heat = PASSIVE_HEAT minus HEAT_DISSIPATION. Insufficient dissipation = gradual overheat without firing.
- × VOLTAGE — Hyper-Conductor converts passive heat into VOLTAGE — passive heat becomes a resource.
- × ON_OVERHEAT — High PASSIVE_HEAT weapons can trigger ON_OVERHEAT without firing, enabling deliberate heat builds.

**PULSE_RADIUS** — Each tag: +25u pulse weapon effective radius. Distinct from BLAST_RADIUS (projectile explosions).
- × PULSE — PULSE behavior weapons use PULSE_RADIUS as their primary area scaling stat.
- × AURA_RADIUS — Both extend ship-centred field effects and stack additively.
- × GLOBAL_RADIUS — Amplifies PULSE_RADIUS alongside every other radius effect in the build.

**PULSE_INTERVAL** — Each tag: -0.3s between automatic pulse firings. Minimum 0.2s.
- × FREQUENCY — FREQUENCY further reduces effective pulse interval.
- × EXECUTION_SPEED — Chrono Architect EXECUTION_SPEED lowers pulse interval via automation loop timing.
- × COOLDOWN — Applies to manually triggered reactive pulse abilities.

---

## [SPECIALIZATION][SPATIAL] — New Tag

**GLOBAL_RADIUS** — Each tag: +12% to all radius-based values across the entire loadout (BLAST_RADIUS, PULSE_RADIUS, PICKUP_RADIUS, mine detection/detonation, AURA_RADIUS, PULL_FORCE fields, singularity reach).
- × BLAST_RADIUS — Explosive AoE grows — every mine, torpedo, and grenade covers more area.
- × GRAVITY — Singularity pull field and PULL_FORCE radius both scale — Graviton Weaver is the primary GLOBAL_RADIUS class.
- × PULSE_RADIUS — Combined with AURA_RADIUS makes Resonance Bard fields enormous.
- × PICKUP_RADIUS — Item collection range grows — high GLOBAL_RADIUS builds passively vacuum the battlefield.
