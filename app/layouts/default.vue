<template>
  <div class="overflow-x-hidden min-h-screen flex flex-col">
    <Navbar />
    <main class="flex-1 pt-20">
      <slot />
    </main>
    <Footer />
  </div>
</template>