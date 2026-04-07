<script lang="ts">
	import { invalidate, invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import type { PageData } from './$types';
	import type { MessagesTable } from '$lib/db/types';

	let { data }: { data: PageData } = $props();

	let messages = $state<MessagesTable[]>([...data.messages]);
	let replyContent = $state('');
	let sending = $state(false);
	let messagesEl = $state<HTMLDivElement | null>(null);
	let error = $state('');

	// Reset state when navigating between users
	$effect(() => {
		void data.targetUser.id; // track user changes
		messages = [...data.messages];
		replyContent = '';
		error = '';
		setTimeout(scrollToBottom, 50);
	});

	function scrollToBottom() {
		if (messagesEl) {
			messagesEl.scrollTop = messagesEl.scrollHeight;
		}
	}

	$effect(() => {
		void messages.length;
		setTimeout(scrollToBottom, 50);
	});

	// Poll for new user messages in the active conversation
	$effect(() => {
		const userId = data.targetUser.id; // re-run when navigating between users
		const initial = untrack(() => messages);
		let since = initial.length > 0 ? Math.max(...initial.map((m) => m.created_at)) : Date.now();

		const poll = setInterval(async () => {
			const res = await fetch(`/admin/${userId}/poll?since=${since}`);
			if (!res.ok) return;
			const newMessages = (await res.json()) as MessagesTable[];
			if (newMessages.length > 0) {
				messages = [...messages, ...newMessages];
				since = Math.max(...newMessages.map((m) => m.created_at));
				setTimeout(scrollToBottom, 50);
			}
		}, 2000);

		// Periodically refresh sidebar unread counts
		const sidebar = setInterval(() => invalidate('app:sidebar'), 10000);

		return () => {
			clearInterval(poll);
			clearInterval(sidebar);
		};
	});

	async function sendReply() {
		const content = replyContent.trim();
		if (!content || sending) return;

		sending = true;
		error = '';
		replyContent = '';

		// Optimistic update
		messages = [
			...messages,
			{
				id: crypto.randomUUID(),
				user_id: data.targetUser.id,
				role: 'admin',
				content,
				created_at: Date.now()
			}
		];

		const res = await fetch(`/admin/${data.targetUser.id}/reply`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content })
		});

		if (!res.ok) {
			error = 'Failed to send reply. Please try again.';
			// Roll back optimistic update
			messages = messages.slice(0, -1);
			replyContent = content;
		}

		// Refresh sidebar unread counts
		await invalidateAll();
		sending = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendReply();
		}
	}

	function formatTime(ts: number): string {
		return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<svelte:head>
	<title>{data.targetUser.username} — chat-omfj Admin</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Conversation header -->
	<header class="flex items-center gap-3 border-b border-zinc-800 px-6 py-3 shrink-0">
		<div class="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-white">
			{data.targetUser.username[0].toUpperCase()}
		</div>
		<div>
			<p class="text-sm font-medium text-white">{data.targetUser.username}</p>
			<p class="text-xs text-zinc-500">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
		</div>
	</header>

	<!-- Messages -->
	<div bind:this={messagesEl} class="flex-1 overflow-y-auto px-6 py-6 space-y-4">
		{#if messages.length === 0}
			<div class="flex h-full flex-col items-center justify-center text-center">
				<p class="text-sm text-zinc-500">No messages yet</p>
				<p class="mt-1 text-xs text-zinc-600">
					{data.targetUser.username} hasn't sent any messages
				</p>
			</div>
		{:else}
			{#each messages as message (message.id)}
				<div class="flex {message.role === 'admin' ? 'justify-end' : 'justify-start'}">
					{#if message.role === 'user'}
						<div class="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-white">
							{data.targetUser.username[0].toUpperCase()}
						</div>
					{/if}
					<div class="flex flex-col {message.role === 'admin' ? 'items-end' : 'items-start'} max-w-[65%]">
						<span class="mb-1 text-xs text-zinc-600">{formatTime(message.created_at)}</span>
						<div
							class="rounded-2xl px-4 py-2.5 text-sm leading-relaxed {message.role === 'admin'
								? 'bg-zinc-200 text-zinc-900 rounded-br-sm'
								: 'bg-zinc-800 text-zinc-100 rounded-bl-sm'}"
						>
							{message.content}
						</div>
					</div>
					{#if message.role === 'admin'}
						<div class="ml-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-600 text-xs font-semibold text-white">
							A
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>

	<!-- Reply area -->
	<div class="border-t border-zinc-800 p-4 shrink-0">
		{#if error}
			<p class="mb-2 text-xs text-red-400">{error}</p>
		{/if}
		<div
			class="flex items-end gap-3 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 focus-within:border-zinc-500 transition-colors"
		>
			<textarea
				bind:value={replyContent}
				onkeydown={handleKeydown}
				rows="1"
				placeholder="Reply as admin…"
				class="flex-1 resize-none bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none max-h-32"
				style="min-height: 1.5rem;"
				oninput={(e) => {
					const el = e.currentTarget;
					el.style.height = 'auto';
					el.style.height = el.scrollHeight + 'px';
				}}
			></textarea>
			<button
				onclick={sendReply}
				disabled={!replyContent.trim() || sending}
				class="shrink-0 rounded-lg bg-zinc-200 p-1.5 text-zinc-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
				aria-label="Send reply"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
					<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
				</svg>
			</button>
		</div>
		<p class="mt-2 text-center text-xs text-zinc-700">Enter to send · Shift+Enter for new line</p>
	</div>
</div>
