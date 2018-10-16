<template>
  <div>
    <h1>Gallery Listing</h1>
    <b-list-group>
      <b-list-group-item v-for="gallery in galleries" class="d-flex justify-content-between align-items-center">
        <a :href="`/gallery/${gallery.id}`">Gallery #{{gallery.id}}: {{gallery.name}} (Floor {{gallery.floor}})</a>
        <b-badge variant="primary" pill>{{gallery.objectcount}}</b-badge>
      </b-list-group-item>
    </b-list-group>
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
