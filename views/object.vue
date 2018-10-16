<template>
  <div>
    <h1>Object Information</h1>

    <ul>
      <li>Title: {{object.title}}</li>
      <li v-if="object.description">Description: {{object.description}}</li>
      <li v-if="object.provenance">Provenance: {{object.provenance}}</li>
      <li>Accession Year: {{object.accessionyear}}</li>
      <img class="mt-2" v-if="object.primaryimageurl" :src="`${object.primaryimageurl}`">
    </ul>

    <h2>Comments</h2>
		<b-list-group>
			<b-list-group-item v-for="comment in comments" :key="comment.id">{{comment.value}}</b-list-group-item>
		</b-list-group>

    <form class="mt-2" v-on:submit.prevent="submit(object.id)">
      <b-form-input type="text" name="comment" placeholder="Write a comment..."></b-form-input>
      <b-button class="mt-2" type="submit" variant="primary">Post</b-button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {}
  },
  methods: {
    submit(objectId) {
      const commentElement = document.querySelector("input[name=comment]");
      const comment = commentElement.value.trim();
      if (!comment)
        return;

      this.comments.push({
        id: this.comments.length + 1,
        value: comment
      });

      const formData = new FormData();
      formData.append("comment", comment);

      fetch(
        `/objects/${objectId}/comment`,
        {
          method: "POST",
          body: formData
        }
      )
      .then(response => {
        commentElement.value = '';
      });
    }
  }
}
</script>

<style>
  img {
    width: 512px;
  }
</style>
