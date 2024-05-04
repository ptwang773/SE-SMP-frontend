<script>
  import axios from "axios";
  import topicSetting from "@/utils/topic-setting";

  export default {
    created() {
      console.log(this.taskDialogOpen)
      this.pr = this.$route.query.pr
      this.projId = this.$route.query.projId
      this.repoId = this.$route.query.repoId
      console.log(this.pr)
      this.getPrDetail();
      this.getTaskList();
      this.getUserRole();
    },
    inject: {
      user: {default: null},
    },
    data() {
      return{
        pr: '',
        projId: '',
        repoId: '',
        getPrDetailBusy: true,
        prDetail: [],
        commits: [],
        taskDialogOpen: false,
        tasks: [],
        headers: [
          {
            text: '任务编号',
            align: 'start',
            value: 'taskId'
          },
          {
            text: '任务名称',
            value: 'taskName'
          },

          {
            text: '',
            value: 'isManage'
          }
        ],
        isProjectReviewer: true,
        reviewStatus: 'open'
      }
    },
    methods: {
      getDarkColor: topicSetting.getDarkColor,
      getUserRole() {
        axios("api/develop/isProjectReviewer", {
          userId: this.user.id,
          projectId: this.projId
        })
            .then((res) => {
              if (res.data.errcode !== 0) {
                this.$message({
                  type: 'error',
                  message: '获取用户权限错误'
                })
              } else {
                this.isProjectReviewer = res.data.flag === 1
              }
            })
      },
      addTask(task) {
        axios.post("api/develop/associatePrTask", {
          userId: this.user.id,
          projectId: this.projId,
          repoId: this.repoId,
          prId: this.prDetail.prId,
          taskId: task.taskId
        })
            .then((res) => {
              if (res.data.errcode !== 0) {
                this.$message({
                  type: 'error',
                  message: '绑定任务失败，发生未知错误'
                })
              } else {
                this.$message({
                  type: 'success',
                  message: '绑定任务项成功！'
                })
              }
            })
      },
      getPrDetail() {
        axios.post("api/develop/getPrDetails", {
          userId: this.user.id,
          projectId: this.projId,
          repoId: this.repoId,
          prId: this.pr.prId
        })
            .then((res) => {
              if (res.data.errcode !== 0) {
                console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
                this.$message({
                  type: 'error',
                  message: '获取pr详情失败，错误码为' + res.data.errcode
                })
                this.getPrDetailBusy = false
              } else {
                this.prDetail = res.data.data
                this.commits = res.data.data.commits
                console.log(this.prDetail)
                this.getPrDetailBusy = false
              }
            })
      },
      getTaskList() {
        axios.post("api/develop/showCanAssociateTasks", {
          projectId: this.projId
        })
            .then((res) => {
              if (res.data.errcode === 0) {
                this.tasks = res.data.data
              }
            })
      },
      checkCommit(commit) {
        this.$router.push({
          path: '/commitReview/' + this.proj.id + '/' + this.selectedRepo.id + '/' + this.prDetail.branch + '/' + commit.id,
          query: {
            commit: commit,
            branchName: this.selectedBranch.name,
            projId: this.proj.id,
            repoId: this.selectedRepo.id
          }
        })
      },
      reviewPr(result) {
        axios.post("api/develop/resolvePr", {
          userId: this.user.id,
          prId: this.prDetail.prId,
          projectId: this.projId,
          repoId: this.repoId,
          action: result
        })
            .then((res) => {
              if (res.data.errcode !== 0) {
                this.$message({
                  type: 'error',
                  message: '发生错误，审核失败'
                })
              } else {
                this.$message({
                  type: 'success',
                  message: '审核成功'
                })
                this.reviewStatus = result === 1 ? 'merged' : 'closed'
              }
            })
      },
      openTaskDialog() {
        this.taskDialogOpen = true
        console.log(this.taskDialogOpen)
      },
      goBack() {
        this.prDetail = []
        this.$router.go(-1)
      },
      getColor(status) {
        if (status === 'open') {
          return "blue";
        } else if (status === 'closed') {
          return "red"
        } else if (status === 'merged') {
          return "green"
        } else {
          return "purple"
        }
      },
      transform(status) {
        if (status === 'open') {
          return "未审核";
        } else if (status === 'closed') {
          return "已拒绝"
        } else if (status === 'merged') {
          return "已合并"
        } else {
          return "未知状态"
        }
      },
    }
  }
</script>

<template>
<div style="margin: 15px">
  <el-page-header @back="goBack" content="PR评审" style="margin-top: 40px"></el-page-header>
  <h1 style="margin-top: 20px; margin-left: 20px"><v-chip label >!{{pr.prId}}</v-chip>  {{this.pr.prTitle}}</h1>
  <div style="margin: 10px 0 0 20px">
    <v-chip :color="getColor(reviewStatus)" dark small label >
      <v-icon small>mdi-source-pull</v-icon>{{ transform(reviewStatus) }}
    </v-chip>
    {{this.pr.prIssuer}}
    <span style="color: grey">创建于：{{this.pr.prTime.slice(0,10)}} {{this.pr.prTime.slice(11,-1)}}
      <v-chip label small style="margin-left: 10px"> {{pr.fromBranchName}}</v-chip> → <v-chip label small>{{pr.toBranchName}}</v-chip>
      <el-button style="margin-left: 85%; margin-top: -40000px; color: white" type="success" @click="this.openTaskDialog"  v-if="this.isProjectReviewer === true">
        +关联任务项
      </el-button>
    </span>
    <div style="display: inline-block; margin-top: -20px; padding: -20px; margin-bottom: -20px"  v-if="this.isProjectReviewer === true && this.reviewStatus === 'open'">
      <v-chip :color="'green'" dark style="margin-right: 30px" @click="reviewPr(1)">
        同意
      </v-chip>
      <v-chip :color="'red'" dark @click="reviewPr(0)">
        拒绝
      </v-chip>
    </div>
    <div style="margin: 10px 0 0 0">
      <v-card style="margin-top: 30px">
        <div v-if="reviewStatus === 'open'">
          <h4 style="color: red; padding: 30px">
            当前尚有未通过的审查/测试
          </h4>
          <div style="padding: 0 0 30px 70px ">
            至少需要1名审查人员后才能合并， 已通过审查人数 0 人
          </div>
        </div>
        <div v-else-if="reviewStatus === 'merged'">
          <h4 style="color: green; padding: 30px">
            当前的pr请求已经通过
          </h4>
        </div>
      </v-card>
      <div style="margin-top: 20px">
        <h3>提交记录 ({{this.commits.length}})</h3>
      </div>
      <v-row>
        <v-col cols="8">
          <v-simple-table dense style="margin-top: 20px">
            <thead>
            <tr>
              <th class="title">commiter</th>
              <th class="title">sha</th>
              <th class="title">time</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="commit in commits" :key="commit.sha" @click="checkCommit(commit)">
              <td class="need-mono">{{commit.author}}</td>
              <td class="need-mono">
                <span> <v-chip label small>{{commit.sha.slice(0, 6)}}</v-chip></span>
              </td>
              <td>{{commit.time.slice(0, 10)}} {{commit.time.slice(11, -1)}}</td>
            </tr>
            </tbody>
          </v-simple-table>
        </v-col>

        <v-divider vertical></v-divider>

        <v-col cols="4">
          <v-card><h3 style="padding: 10px">关联工作项</h3>
            <div style="margin-left: 30px;margin-top: 10px">
               here will be associated tasks
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>

  <v-dialog v-model="taskDialogOpen" width="700">
    <template>
      <v-container class="pa-0">
        <v-card>
          <v-card-title class="headline font-weight text-left">关联任务项到当前 Pull Request 请求</v-card-title>
          <v-data-table
              :headers="headers"
              :items="tasks">
                <template #item.isManage="{item}">
                  <v-chip :color="'green'" dark @click="addTask(item)">
                    +
                  </v-chip>
                </template>

              </v-data-table>
        </v-card>
      </v-container>
    </template>
  </v-dialog>
</div>
</template>

<style scoped>

</style>