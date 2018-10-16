<template>
  <div>
    <h1>Object Listing</h1>
    <b-table :fields="fields" :items="objects">
      <template slot="title" slot-scope="data">
          <a :href="`/objects/${data.item.id}`">{{data.item.title}}</a>
      </template>

      <template slot="id" slot-scope="data">
        {{data.item.id}}
      </template>

      <template slot="primaryimageurl" slot-scope="data">
        <img v-if="data.item.primaryimageurl" :src="data.item.primaryimageurl">
        <span v-else>N/A</span>
      </template>

      <template slot="url" slot-scope="data">
          <a :href="`${data.item.url}`">Harvard Art Museums</a>
      </template>
    </b-table>
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
  img {
    width: 100px;    
  }
</style>
