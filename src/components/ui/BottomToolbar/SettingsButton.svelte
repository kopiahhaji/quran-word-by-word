<script>
	import SettingsFilled from '$svgs/SettingsFilled.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import { __settingsDrawerHidden } from '$utils/stores';
</script>

<div class="flex items-center justify-center">
	<button type="button" title="Settings" on:click={() => ($__settingsDrawerHidden = false)} class="inline-flex flex-col items-center justify-center w-12 h-12 rounded-full group {window.theme('hover')}" data-umami-event="Toolbar Settings Button">
		<SettingsFilled size={5} />
		<span class="sr-only">Settings</span>
	</button>
</div>
<Tooltip arrow={false} type="light" class="hidden md:block font-normal">Settings</Tooltip>
