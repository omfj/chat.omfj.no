<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Sign in — chat-omfj</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
	<div class="w-full max-w-sm">
		<div class="mb-8 text-center">
			<h1 class="text-2xl font-semibold text-white">Welcome to chat.omfj.no</h1>
			<p class="mt-1 text-sm text-zinc-400">Sign in</p>
		</div>

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="space-y-4"
		>
			{#if form?.error}
				<div class="rounded-lg bg-red-950/50 px-4 py-3 text-sm text-red-400 border border-red-900">
					{form.error}
				</div>
			{/if}

			<div>
				<label for="username" class="block mb-1.5 text-sm font-medium text-zinc-300">
					Username
				</label>
				<input
					id="username"
					name="username"
					type="text"
					autocomplete="username"
					required
					class="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
					placeholder="your-username"
				/>
			</div>

			<div>
				<label for="password" class="block mb-1.5 text-sm font-medium text-zinc-300">
					Password
				</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					class="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
					placeholder="••••••••"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-lg bg-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
			>
				{loading ? 'Signing in…' : 'Sign in'}
			</button>
		</form>

		<p class="mt-6 text-center text-sm text-zinc-500">
			Don't have an account?
			<a href="/signup" class="text-zinc-300 hover:text-white">Sign up</a>
		</p>
	</div>
</div>
