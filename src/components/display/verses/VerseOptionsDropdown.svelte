<script>
	export let page;

	import Dropdown from '$ui/FlowbiteSvelte/dropdown/Dropdown.svelte';
	import DropdownItem from '$ui/FlowbiteSvelte/dropdown/DropdownItem.svelte';
	import Play from '$svgs/Play.svelte';
	import Bookmark from '$svgs/Bookmark.svelte';
	import BookmarkFilled from '$svgs/BookmarkFilled.svelte';
	import Notes from '$svgs/Notes.svelte';
	import NotesFilled from '$svgs/NotesFilled.svelte';
	import Tafsir from '$svgs/Tafsir.svelte';
	import VerseTranslation from '$svgs/VerseTranslation.svelte';
	import ChapterMode from '$svgs/ChapterMode.svelte';
	import Book from '$svgs/Book.svelte';
	import Morphology from '$svgs/Morphology.svelte';
	import Copy from '$svgs/Copy.svelte';
	import { showAudioModal } from '$utils/audioController';
	import { selectableDisplays } from '$data/options';
	import { 
		__currentPage, 
		__verseKey, 
		__userSettings, 
		__userNotes, 
		__audioModalVisible, 
		__notesModalVisible, 
		__verseTranslationModalVisible, 
		__tafsirModalVisible, 
		__morphologyKey, 
		__morphologyModalVisible, 
		__copyShareVerseModalVisible, 
		__displayType, 
		__fontType 
	} from '$utils/stores';
	import { updateSettings } from '$utils/updateSettings';
	import { term } from '$utils/terminologies';
	import { selectableFontTypes } from '$data/options';

	let dropdownOpen = false;
	
	$: chapter = parseInt($__verseKey.split(':')[0], 10);
	$: verse = parseInt($__verseKey.split(':')[1], 10);
	$: isBookmarked = JSON.parse($__userSettings).userBookmarks.includes($__verseKey);
	$: hasNotes = Object.prototype.hasOwnProperty.call($__userNotes, $__verseKey);

	// Mode switching items
	$: modeItems =
		$__currentPage === 'mushaf'
			? [
					{
						href: `/${chapter}?startVerse=${verse}`,
						icon: ChapterMode,
						text: `📖 ${term('chapter')} Reading Mode`,
						analyticsEvent: 'Chapter Mode Button'
					}
				]
			: [
					{
						href: `/page/${page}`,
						icon: Book,
						text: `📄 Mushaf Page Mode`,
						analyticsEvent: 'Mushaf Mode Button'
					}
				];

	// Audio items
	$: audioItems = [
		{
			icon: Play,
			text: `🎵 Advanced Audio Options`,
			action: () => {
				showAudioModal($__verseKey);
				dropdownOpen = false;
			},
			analyticsEvent: 'Advanced Audio Modal Button'
		}
	];

	// Bookmark items
	$: bookmarkItems = [
		{
			icon: isBookmarked ? BookmarkFilled : Bookmark,
			text: isBookmarked ? `🔖 Remove Bookmark` : `📌 Add Bookmark`,
			action: () => {
				updateSettings({ type: 'userBookmarks', key: $__verseKey, set: true });
				dropdownOpen = false;
			},
			analyticsEvent: 'Bookmark Button'
		}
	];

	// Notes items
	$: notesItems = [
		{
			icon: hasNotes ? NotesFilled : Notes,
			text: hasNotes ? `📝 Edit Notes` : `📄 Add Notes`,
			action: () => {
				__notesModalVisible.set(true);
				dropdownOpen = false;
			},
			analyticsEvent: 'Notes Modal Button'
		}
	];

	// Translation and study items
	$: studyItems = [
		{
			icon: VerseTranslation,
			text: `🌍 Verse Translations`,
			action: () => {
				__verseTranslationModalVisible.set(true);
				dropdownOpen = false;
			},
			analyticsEvent: 'Verse Translation Modal Button'
		},
		{
			icon: Tafsir,
			text: `📚 Tafsir Commentary`,
			action: () => {
				__tafsirModalVisible.set(true);
				dropdownOpen = false;
			},
			analyticsEvent: 'Tafsir Modal Button'
		},
		{
			icon: Morphology,
			text: `🔤 Word Analysis`,
			action: () => {
				__morphologyKey.set($__verseKey);
				__morphologyModalVisible.set(true);
				dropdownOpen = false;
			},
			analyticsEvent: 'Morphology Modal Button'
		}
	];

	// Copy and share items
	$: shareItems = [
		{
			icon: Copy,
			text: `📋 Copy & Share`,
			action: () => {
				__copyShareVerseModalVisible.set(true);
				dropdownOpen = false;
			},
			analyticsEvent: 'Copy Share Modal Button'
		}
	];

	// Display type items
	$: displayItems = Object.values(selectableDisplays).map((display) => ({
		text: `${display.displayName}`,
		action: () => {
			updateSettings({ type: 'displayType', value: display.displayID });
			dropdownOpen = false;
		},
		active: $__displayType === display.displayID,
		analyticsEvent: `Display Type ${display.displayName} Button`
	}));

	// Font type items (only for mushaf mode)
	$: fontItems = 
		$__currentPage === 'mushaf' 
			? Object.values(selectableFontTypes)
				.filter(fontType => !fontType.disallowedIn.includes('mushaf'))
				.map((fontType) => ({
					text: `🖋️ ${fontType.font}`,
					action: () => {
						updateSettings({ type: 'fontType', value: fontType.id });
						dropdownOpen = false;
					},
					active: $__fontType === fontType.id,
					analyticsEvent: `Font Type ${fontType.font} Button`
				}))
			: [];

	// All menu items grouped
	$: allItems = [
		...modeItems,
		...audioItems,
		...bookmarkItems,
		...notesItems,
		...studyItems,
		...shareItems,
		...displayItems,
		...fontItems
	];
</script>

<Dropdown bind:open={dropdownOpen} class="w-64">
	{#each allItems as item}
		{#if item.href}
			<DropdownItem href={item.href} on:click={() => (dropdownOpen = false)}>
				<svelte:component this={item.icon} />
				<span class="ml-2">{item.text}</span>
			</DropdownItem>
		{:else}
			<DropdownItem on:click={item.action} class={item.active ? 'bg-gray-100 dark:bg-gray-600' : ''}>
				<svelte:component this={item.icon} />
				<span class="ml-2">{item.text}</span>
			</DropdownItem>
		{/if}
	{/each}
</Dropdown>
