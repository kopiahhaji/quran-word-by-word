<script>
	export let key;

	import Spinner from '$svgs/Spinner.svelte';
	import { fetchChapterData } from '$utils/fetchData';
	import { __fontType } from '$utils/stores';
	import { splitDelimiter } from '$data/websiteSettings';

	const [chapter, verse] = key.split(':').map(Number);

	$: fontType = [1, 2, 3, 5, 7, 8].includes($__fontType) ? 1 : 4;

	$: chapterData = (async () => {
		const data = await fetchChapterData({ chapter, fontType, skipSave: true, reRenderWhenTheseUpdates: [$__fontType] });
		return data[`${chapter}:${verse}`];
	})();
</script>

{#await chapterData}
	<Spinner size="10" />
{:then data}
	<div class="direction-rtl text-3xl leading-normal arabic-font-{fontType}">
		{data.words.arabic.split(splitDelimiter).join(' ')}
		<span class="colored-fonts">{data.words.end}</span>
	</div>
{:catch _}
	<p>error.</p>
{/await}
