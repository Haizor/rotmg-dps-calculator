# v0.1.1
* Fixed tooltips not switching sides when reaching the edge of the screen
* Color picker style changes & usability
* Pet magic heal field is now capped properly
* Rate of Fire is now included in DPS calculations

# v0.1.0

Initial release!

Major changes from the previous version
* DPS is now simulated behind the scene instead of just using a formula. This means a few things:
	* Some procs (like stat boosts) are supported, with more coming in the future.
	* The downside of this approach is that DPS values aren't calculated for every single DEF value, and is spread out now by default.
	* Ability DPS is supported partially aswell! You can tell if an ability is being included by looking for a star in the ability tooltip. Each star means that specific part of the ability is supported.
* No scrolling section on the side. You now have to click on the individual set on the right-hand side to edit that set.
	* This may be changed in the future to make it more seamless, since it can feel clunky trying to change equipment for a bunch of sets.

A few things aren't implemented at the moment:
* Custom weapons. They'll most likely be implemented using the sandbox, but it's low priority at the moment.
* Enemies aren't shown at the various DEF values.
* Burst support is kind of implemented, but it's probably wrong since I have virtually no info about it.