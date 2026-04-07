<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	function truncate(text: string, max = 45): string {
		return text.length > max ? text.slice(0, max) + '…' : text;
	}

	function timeAgo(ts: number): string {
		const diff = Date.now() - ts;
		const m = Math.floor(diff / 60000);
		const h = Math.floor(diff / 3600000);
		const d = Math.floor(diff / 86400000);
		if (m < 1) return 'just now';
		if (m < 60) return `${m}m`;
		if (h < 24) return `${h}h`;
		return `${d}d`;
	}
</script>

<div class="flex h-screen bg-zinc-950">
	<!-- Sidebar -->
	<aside class="flex w-72 shrink-0 flex-col border-r border-zinc-800">
		<!-- Sidebar header -->
		<div class="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
			<div>
				<h1 class="text-sm font-semibold text-white">chat-omfj</h1>
				<p class="text-xs text-zinc-500">Admin panel</p>
			</div>
			<form method="POST" action="/logout">
				<button type="submit" class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
					Sign out
				</button>
			</form>
		</div>

		<!-- Conversation list -->
		<nav class="flex-1 overflow-y-auto py-2">
			{#if data.conversations.length === 0}
				<p class="px-4 py-8 text-center text-xs text-zinc-600">No conversations yet</p>
			{:else}
				{#each data.conversations as { user, lastMessage, unreadCount }}
					{@const isActive = page.url.pathname === `/admin/${user.id}`}
					<a
						href="/admin/{user.id}"
						class="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-zinc-900 {isActive
							? 'bg-zinc-900 border-l-2 border-zinc-400'
							: 'border-l-2 border-transparent'}"
					>
						<!-- Avatar -->
						<div
							class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-white"
						>
							{user.username[0].toUpperCase()}
						</div>

						<!-- Info -->
						<div class="min-w-0 flex-1">
							<div class="flex items-center justify-between gap-2">
								<span class="truncate text-sm font-medium text-white">{user.username}</span>
								{#if lastMessage}
									<span class="shrink-0 text-xs text-zinc-600">{timeAgo(lastMessage.created_at)}</span>
								{/if}
							</div>
							{#if lastMessage}
								<p class="mt-0.5 truncate text-xs text-zinc-500">
									{lastMessage.role === 'admin' ? 'You: ' : ''}{truncate(lastMessage.content)}
								</p>
							{:else}
								<p class="mt-0.5 text-xs text-zinc-600">No messages yet</p>
							{/if}
						</div>

						<!-- Unread badge -->
						{#if unreadCount > 0}
							<div
								class="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-zinc-300 px-1.5 text-xs font-semibold text-zinc-900"
							>
								{unreadCount}
							</div>
						{/if}
					</a>
				{/each}
			{/if}
		</nav>
	</aside>

	<!-- Main content -->
	<main class="flex flex-1 flex-col overflow-hidden">
		{@render children()}
	</main>
</div>
