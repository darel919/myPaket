<template>
    <footer class="bg-black text-white p-8 mt-8">
        <div class="flex flex-col space-y-4">
            <div class="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-start sm:gap-8">
                <NuxtLink class="no-underline hover:no-underline" to="/">
                    <p class="text-xl sm:text-2xl font-bold">myPaket</p>
            
                </NuxtLink>
                <div class="flex flex-col">
                    <NuxtLink to="/settings" class="my-1 text-sm hover:underline">Settings</NuxtLink>
                </div>
            </div>
        </div>
    </footer>
</template>

<style scoped>
/* Remove existing style that adds underline on hover */
</style>
