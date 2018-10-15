<template>
  <div>
    <h1>Gallery Listing</h1>
    <ul>
      <li v-for="gallery in galleries">
        <a :href="`/gallery/${gallery.id}`">Gallery #{{gallery.id}}: {{gallery.name}} (Floor {{gallery.floor}})</a>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
    data() {
      return {};
    }
}
</script>

<style>
</style>
