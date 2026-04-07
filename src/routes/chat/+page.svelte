<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageData } from './$types';
	import type { MessagesTable } from '$lib/db/types';

	let { data }: { data: PageData } = $props();

	// Seed from server data once; managed locally thereafter (SSE + optimistic updates)
	let messages = $state<MessagesTable[]>(untrack(() => [...data.messages]));
	let inputValue = $state('');
	let messagesEl = $state<HTMLDivElement | null>(null);
	let inputEl = $state<HTMLTextAreaElement | null>(null);

	function scrollToBottom() {
		if (messagesEl) {
			messagesEl.scrollTop = messagesEl.scrollHeight;
		}
	}

	// Poll for new admin messages every 2 seconds
	$effect(() => {
		let since = messages.length > 0 ? Math.max(...messages.map((m) => m.created_at)) : Date.now();

		const interval = setInterval(async () => {
			const res = await fetch(`/chat/poll?since=${since}`);
			if (!res.ok) return;
			const newMessages = (await res.json()) as MessagesTable[];
			if (newMessages.length > 0) {
				messages = [...messages, ...newMessages];
				since = Math.max(...newMessages.map((m) => m.created_at));
				setTimeout(scrollToBottom, 50);
			}
		}, 2000);

		return () => clearInterval(interval);
	});

	// Scroll to bottom when messages change
	$effect(() => {
		// Track messages length to trigger effect
		void messages.length;
		setTimeout(scrollToBottom, 50);
	});

	async function sendMessage() {
		const content = inputValue.trim();
		if (!content) return;

		inputValue = '';

		// Optimistic update
		messages = [
			...messages,
			{
				id: crypto.randomUUID(),
				user_id: data.user.id,
				role: 'user',
				content,
				created_at: Date.now()
			}
		];

		await fetch('/chat/message', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content })
		});
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}
</script>

<svelte:head>
	<title>Chat — chat-omfj</title>
</svelte:head>

<div class="flex h-screen flex-col bg-zinc-950">
	<!-- Header (full-width border, content capped at 1400px) -->
	<header class="border-b border-zinc-800 shrink-0">
		<div class="mx-auto flex w-full max-w-[1000px] items-center justify-between px-6 py-3">
			<div class="flex items-center gap-3">
				<div class="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-semibold text-white">
					H
				</div>
				<div>
					<p class="text-sm font-medium text-white">chat-omfj</p>
					<p class="text-xs text-zinc-400">You're chatting with Ole Magnus</p>
				</div>
			</div>
			<form method="POST" action="/logout">
				<button type="submit" class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
					Sign out
				</button>
			</form>
		</div>
	</header>

	<!-- Messages (scrollable, content capped at 1400px) -->
	<div bind:this={messagesEl} class="flex-1 overflow-y-auto">
		<div class="mx-auto w-full max-w-[1000px] px-6 py-6 space-y-4">
			{#if messages.length === 0}
				<div class="flex flex-col items-center justify-center py-32 text-center">
					<div class="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
						<svg class="h-6 w-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
					</div>
					<p class="text-sm font-medium text-zinc-300">Start the conversation</p>
					<p class="mt-1 text-xs text-zinc-500">Send a message to get started</p>
				</div>
			{:else}
				{#each messages as message (message.id)}
					<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
						{#if message.role === 'admin'}
							<div class="mr-2 mt-1 h-7 w-7 shrink-0 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold text-white">
								H
							</div>
						{/if}
						<div class="flex flex-col {message.role === 'user' ? 'items-end' : 'items-start'} max-w-[65%]">
							{#if message.role === 'admin'}
								<span class="mb-1 text-xs text-zinc-500">Ole Magnus</span>
							{/if}
							<div
								class="rounded-2xl px-4 py-2.5 text-sm leading-relaxed {message.role === 'user'
									? 'bg-zinc-200 text-zinc-900 rounded-br-sm'
									: 'bg-zinc-800 text-zinc-100 rounded-bl-sm'}"
							>
								{message.content}
							</div>
						</div>
					</div>
				{/each}

			{/if}
		</div>
	</div>

	<!-- Input area (full-width border, content capped at 1400px) -->
	<div class="border-t border-zinc-800 shrink-0">
		<div class="mx-auto w-full max-w-[1000px] p-6">
			<div class="flex items-end gap-3 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 focus-within:border-zinc-500 transition-colors">
				<textarea
					bind:this={inputEl}
					bind:value={inputValue}
					onkeydown={handleKeydown}
					rows="1"
					placeholder="Send a message…"
					class="flex-1 resize-none bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none max-h-32"
					style="height: auto; min-height: 1.5rem;"
					oninput={(e) => {
						const el = e.currentTarget;
						el.style.height = 'auto';
						el.style.height = el.scrollHeight + 'px';
					}}
				></textarea>
				<button
					onclick={sendMessage}
					disabled={!inputValue.trim()}
					class="shrink-0 rounded-lg bg-zinc-200 p-1.5 text-zinc-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
					aria-label="Send message"
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
						<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
					</svg>
				</button>
			</div>
			<p class="mt-2 text-center text-xs text-zinc-600">Press Enter to send · Shift+Enter for new line</p>
		</div>
	</div>
</div>
