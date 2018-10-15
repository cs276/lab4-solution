<template>
  <div>
    <h1>Object Listing</h1>
    <table>
      <tr v-for="object in objects">
        <td>
          <a :href="`/objects/${object.id}`">{{object.title}}</a>
        </td>
        <td>
          <img v-if="object.primaryimageurl" :src="object.primaryimageurl">
          <span v-else>N/A</span>
        </td>
        <td>
          <a :href="`${object.url}`">See more</a>
        </td>
      </tr>
    </table>
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
