<template>
  <div>
    <h1>Object Information</h1>
    <ul>
      <li>Title: {{object.title}}</li>
      <li v-if="object.description">Description: {{object.description}}</li>
      <li v-if="object.provenance">Provenance: {{object.provenance}}</li>
      <li>Accession Year: {{object.accessionyear}}</li>
      <img v-if="object.primaryimageurl" :src="`${object.primaryimageurl}`">
    </ul>

    <h2>Comments</h2>
    <ul>
      <li v-for="comment in comments" :key="comment.id">{{comment.value}}</li>
    </ul>
    <form v-on:submit.prevent="submit(object.id)">
      <input class="form-control" type="text" name="comment" placeholder="Write a comment...">
      <button class="btn btn-primary" type="submit">Post</button>
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

      if (!this.comments)
        this.comments = [];

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
