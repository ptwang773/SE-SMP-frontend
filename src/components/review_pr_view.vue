<script>
import axios from "axios";
import topicSetting from "@/utils/topic-setting";
import commit from "../views/user/reviews/Commit.vue";

export default {
  name: "review_pr_view",
  methods: {
      updatePrList() {
        this.prListBusy = true
        console.log(this.prList)
          axios.post('/api/develop/getPrList', {
            userId: this.user.id,
            projectId: this.proj.id,
            repoId: this.selectedRepo.id,
          }).then((res) => {
              if (res.data.errcode === 0) {
                  this.prList = res.data.data
                let today = new Date()
                  // get past 10 days
                  let statsPerDay = {}
                  for (let i = 0; i < 10; i++) {
                      let str = (today.getMonth() + 1) + '.' + today.getDate()
                      statsPerDay[str] = 0
                      today.setDate(today.getDate() - 1)
                  }
                  this.prListBusy = false
                  this.statsPerDay = {
                      label: Object.keys(statsPerDay).reverse(),
                      value: Object.values(statsPerDay).reverse()
                  }
              } else {
                  console.log(res)
                  alert('/api/reviews/getPrList error with not 0 err code (' + res.data.errcode + ') ' + res.data.message)
                  this.prListBusy = false
              }
          }).catch((err) => {
              alert('/api/reviews/getPrList error' + err)
              this.prListBusy = false
          })
      },
      getTopicColor: topicSetting.getColor,
      getDarkColor: topicSetting.getDarkColor,
      reviewSelectedPr(pr) {
        console.log(pr)
        this.$router.push({
          path: '/prReview/' + this.proj.id + '/' + this.selectedRepo.id + '/' + pr.prId,
          query: {
            pr: pr,
            projId: this.proj.id,
            repoId: this.selectedRepo.id
          }
        })
      },
      getColor(status) {
        if (status) {
          return "red";
        } else {
          return "green"
        }
      },
      transform(status) {
        if (status) {
          return "未审核";
        } else {
          return "已审核"
        }
      },
  },
  data() {
    return {
     prListBusy: false,
      prList: [
        {
          prId: 14,
          prIssuer: "ptwang773",
          prTitle: "test pr888",
          prTime: "2024-04-28T08:54:14Z",
          isOpen: false,
          ghLink: "https://github.com/ptwang773/test/pull/14",
          fromBranchName: "pr",
          toBranchName: "main"
        }
      ],
      statsPerDay: {}
    }
  }, watch: {
    selectedBranch() {
        this.updatePrList()
    }
  }, created() {
        this.updatePrList()

  }, inject: {
    user: {default: null},
    proj: {default: null},
    selectedRepo: {default: null},
    selectedBranch: {default: null}
  }
}
</script>

<template>
<div>
<v-card-title>仓库中的Pull Request记录</v-card-title>
  <p v-if="!prListBusy && prList.length > 0" style="margin-left: 15px">当前仓库中有 {{this.prList.length}} 条 pr 记录，请选择要查看的 pr ：</p>
  <p v-else-if="prList.length > 0" style="margin-left: 15px">正在从服务器中读取pr记录，请稍候...</p>
  <div v-if="!prListBusy && prList.length > 0">
      <v-simple-table dense>
          <thead>
          <tr>
              <th class="issuer">issuer</th>
              <th class="Title">title</th>
              <th class="status">status</th>
              <th class="branch">branch</th>
              <th class="time">time</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="pr in this.prList" :key="pr.prId" @click="reviewSelectedPr(pr)">
              <td class="need-mono">{{pr.prIssuer}}</td>
              <td>{{pr.prTitle}}</td>
              <td>
                <v-chip :color="getColor(pr.isOpen)" dark small>
                  {{ transform(pr.isOpen) }}
                </v-chip>
              </td>
              <td class="need-mono">
                <span> <v-chip label small>{{pr.fromBranchName}}</v-chip> → <v-chip label small>{{pr.toBranchName}}</v-chip></span>
              </td>
              <td>{{pr.prTime.slice(0, 10)}} {{pr.prTime.slice(11, -1)}}</td>
          </tr>
          </tbody>
      </v-simple-table>
      <br>


  </div>
  <v-skeleton-loader v-else-if="prListBusy" type="table" class="mx-auto" />
  <div v-else style="margin-top: -40px">
    <el-empty :image-size="200" description="当前仓库中没有pr记录"></el-empty>
  </div>
</div>
</template>


<style scoped>
.need-mono {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
}
</style>