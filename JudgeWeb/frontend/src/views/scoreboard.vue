<template>
  <v-card>
    <v-card-title>
      Scoreboard
      <v-spacer></v-spacer>
      <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
      ></v-text-field>
    </v-card-title>
    <v-data-table
        :headers="headers"
        :items="list"
        :search="search"
        hide-default-footer
    ></v-data-table>
  </v-card>
</template>

<script>
export default {
    name: 'scoreboard.vue',
    data: () => {
        return {
            list : [],
            search: '',
            headers : [
                {
                    text : 'rank',
                    value : 'rank',
                    align : 'rank'
                },
                { text : 'name', value : 'userName'}
            ]
        };
    },
    mounted() {
        const id = this.$route.params.id;
        if (id === undefined)
            this.$router.go(-1);
        this.$http.get(`/api/contest/scoreboard/${id}`)
            .then(result => {
                const list = result.data;
                this.$log.info(list);
                for(let i = 0; i < list.length; i++) {
                    const obj = {
                        rank : 0,
                        userName : '',
                        problem : [],
                        total : ''
                    };
                    obj.rank = i + 1;
                    obj.userName = list[i].userName;
                    obj.total = `${list[i].acceptCnt} / ${list[i].penaltySum}`;
                    for(let j = 0;j < list[i].problemList.length ; j++) {
                        const problem = list[i].problemList[j];
                        this.$log.info(problem.accept);
                        const penalty = problem.accept === false ? '-' : problem.penalty;
                        obj.problem.push(`${problem.submitCnt} / ${penalty}`);
                        this.headers.push({text : `${String.fromCharCode(j + 65)}`, value : 'problem[' + j + ']'});
                    }
                    this.headers.push({text : 'total', value : 'total'});
                    this.list.push(obj);
                }
            })
            .catch(err => {
                this.$log.error(err);
            });
    }
};
</script>

<style scoped>

</style>