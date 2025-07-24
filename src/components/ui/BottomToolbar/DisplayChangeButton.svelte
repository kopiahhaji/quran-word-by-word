<script>
	import EyeFilled from '$svgs/EyeFilled.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import DisplayTypeSelector from '$ui/SettingsDrawer/DisplayTypeSelector.svelte';
	import { __settingsSelectorModal } from '$utils/stores';
</script>

<div class="flex items-center justify-center">
	<button id="changeDisplayButton" type="button" title="Display Type" class="inline-flex flex-col items-center justify-center w-12 h-12 rounded-full group {window.theme('hover')}" on:click={() => __settingsSelectorModal.set({ component: DisplayTypeSelector, visible: true, title: 'Display Type' })} data-umami-event="Toolbar Display Change Button">
		<EyeFilled size={5} />
		<span class="sr-only">Display Type</span>
	</button>
</div>
<Tooltip triggeredBy="#changeDisplayButton" arrow={false} type="light" class="hidden md:block font-normal">Display Type</Tooltip>
