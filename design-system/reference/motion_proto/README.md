# Atlas Motion — physical interactions
Real spring-physics prototype. Three interactions, all using Framer Motion's spring solver:
1. **Card drag + drop** — mass-physics drag with overshoot landing on release
2. **Quick capture** — gesture-driven bottom sheet, pull-down dismiss with velocity
3. **Page transition** — shared-element continuous motion between list and detail

Spring constants come from `motion.css` (`--spring-*`). Tweak there and they propagate.
