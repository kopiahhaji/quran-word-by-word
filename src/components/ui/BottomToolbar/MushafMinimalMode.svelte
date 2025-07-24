<script>
	import Maximize from '$svgs/Maximize.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import { toggleMushafMinimalMode } from '$utils/toggleMushafMinimalMode';
</script>

<div class="flex items-center justify-center">
	<button id="mushafMinimalModeButton" type="button" title="Minimal Mode" class="inline-flex flex-col items-center justify-center w-12 h-12 rounded-full group {window.theme('hover')}" on:click={toggleMushafMinimalMode}>
		<Maximize />
		<span class="sr-only">Minimal Mode</span>
	</button>
</div>
<Tooltip triggeredBy="#mushafMinimalModeButton" arrow={false} type="light" class="hidden md:block font-normal">Minimal Mode</Tooltip>
