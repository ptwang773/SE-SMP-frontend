<script>
import axios from "axios";
import Cookies from "js-cookie";
import getIdenticon from "@/utils/identicon";

export default {
  inject: {
    user: {default: null},
    getCommitDetailBusy: {default: true},
    comments: {default: null}
  },
    created() {
      this.user = Cookies.get('user')
      console.log(this.user)
      console.log(this.user.id)
      this.commitMessage = this.$route.query.commit
      this.branchName = this.$route.query.branchName
      this.projId = this.$route.query.projId
      this.repoId = this.$route.query.repoId
      console.log("branch:" + this.$route.query.branchName)
      console.log("proj:" + this.$route.query.projId)
      console.log("repo:" + this.$route.query.repoId)
      axios.post("api/develop/getCommitDetails", {
        userId: this.user.id,
        projectId: this.projId,
        repoId: this.repoId,
        sha: this.commitMessage.hash
      })
          .then((response) => {
            console.log(response)
            if (response.data.errcode === 6) {
              console.log("error in getting commit details")
              alert("请检查账号的Token是否已绑定及绑定的Token是否正确")
              this.$router.go(-1)
            } else {
              this.commitDetails = response.data.commit
              this.getCommitDetailBusy = false
              this.comments = response.data.commit.comments
              console.log(this.commitDetails)
            }
          })
      axios.post("api/develop/isProjectReviewer", {
        userId: this.user.id,
        projectId: this.projId
      })
          .then((response) => {
            if (response.data.errcode === 2) {
              this.$message({
                type: 'error',
                message: '用户不在该项目中'
              })
            } else if (response.data.errcode === 0) {
              this.isProjectReviewer = response.data.flag === 1
            }
          })
    },
    data() {
      return {
        commitMessage: '',
        branchName: '',
        projId: '',
        repoId: '',
        commitDetails: '',
        textarea: '',
        isProjectReviewer: false
      }
    },
  methods: {
    reviewCommit(result) {
      axios.post("api/develop/modifyCommitStatus", {
        userId: this.user.id,
        projectId: this.projId,
        repoId: this.repoId,
        sha: this.commitMessage.hash,
        reviewStatus: result
      })
          .then(() => {
            this.$message({
              type: 'success',
              message: '审核完成！'
            })
            this.commitDetails.status = result === 1 ? 'Y' : 'N'
          })
    },
     goBack() {
        console.log('go back')
        this.commitMessage = ''
        this.branchName = ''
        this.projId = ''
        this.repoId = ''
        this.commitDetails = ''
        this.textarea = ''
        this.$router.go(-1)
      },
      submitComment() {
        if (this.textarea === '') {
          this.$message({
            type: 'error',
            message: '评论不能为空！'
          })
          return
        }
        axios.post("api/develop/commentCommit", {
          userId: this.user.id,
          projectId: this.projId,
          repoId: this.repoId,
          comment: this.textarea,
          sha: this.commitMessage.hash
        })
            .then(() => {
              this.comments.push({
                comment: this.textarea,
                reviewerName: this.user.name
              })
              console.log(this.textarea)
              this.$message({
                type: 'success',
                message: '评论成功'
              })
              this.textarea = ''
            })
      },
      getColor(status) {
        if (status === null) {
          return "blue";
        } else if (status === 'Y') {
          return "green";
        } else if (status === 'N') {
          return "red"
        }
      },
      transform(status) {
        if (status === null) {
          return "待审核";
        } else if (status === 'Y') {
          return "审核通过";
        } else if (status === 'N') {
          return "审核未通过"
        }
      },
      getIdenticon,
  }
}
</script>

<template>
  <div style="margin: 15px">
    <el-page-header @back="goBack" content="评审" style="margin-top: 40px"></el-page-header>
    <h1 style="margin-top: 20px; margin-left: 20px">Commit</h1>
    <div style="margin-bottom: 10px; margin-left: 20px">
      <v-chip :color="getColor(this.commitDetails.status)" dark v-if="this.getCommitDetailBusy === false">
        {{ transform(this.commitDetails.status) }}
      </v-chip>
      <v-chip  dark v-else>
        加载中
      </v-chip>
    </div>
    <div>
      <v-divider style="margin-left: 20px"></v-divider>
    </div>
    <el-card style="margin-top: 15px; margin-bottom: 15px">
      <h3>{{commitMessage.message}}</h3>
      <div style="font-size:0.4cm; margin-top:10px; padding-bottom: 10px">branch: <b>{{this.branchName}}</b></div>
      <div></div>
      <v-divider style="margin-bottom: 15px"></v-divider>
      <b style="margin-top: 20px">{{this.commitMessage.committer}}</b> committed at {{this.commitMessage.time.slice(4,-5)}}
      <div></div>
      <div style="display: inline-block; margin-top: 20px" v-if="this.isProjectReviewer === true && this.commitDetails.status === null && this.getCommitDetailBusy === false">
        <v-chip :color="'green'" dark style="margin-right: 30px" @click="reviewCommit(1)">
        同意
      </v-chip>
      <v-chip :color="'red'" dark @click="reviewCommit(0)">
        拒绝
      </v-chip>
      </div>
    </el-card>
    <v-divider></v-divider>
    <h1>TODO:diff部分内容</h1>
    <v-divider></v-divider>
    <div style="margin-top: 20px;">
      <div style="margin-bottom: 10px"><b>{{this.comments.length}}</b> comments on commit <v-chip label small>{{this.commitDetails.sha.slice(0, 6)}}</v-chip></div>

      <el-input
        type="textarea"
        :rows="4"
        placeholder="请输入评论内容"
        v-model="textarea"
      v-if="this.commitDetails.status === null && this.isProjectReviewer === true">
        </el-input>
      <el-input
        type="textarea"
        :rows="4"
        placeholder="审核已完成，不可评论"
        v-model="textarea"
        v-else-if="this.isProjectReviewer === true"
        disabled>
        </el-input>
      <el-input
        type="textarea"
        :rows="4"
        placeholder="您不是审核人员，无法评论"
        v-model="textarea"
        v-else
        disabled>
        </el-input>
       <el-button style="margin-top: 14px; margin-left: auto; justify-content: flex-end; display: flex" type="success" @click="submitComment()" dark v-if="this.commitDetails.status === null && this.isProjectReviewer === true">
         提交评论
       </el-button>
      <el-button style="margin-top: 14px; margin-left: auto; justify-content: flex-end; display: flex" type="success" @click="submitComment()" dark v-else disabled>
         提交评论
       </el-button>
      <div class="comment" v-for="item in comments" style="margin: 0px 30px 0 30px">
          <span style="font-size: 0.5cm;"><strong>{{ item.reviewerName }}</strong></span>
          <div style="margin-top: 15px;">&nbsp;&nbsp;&nbsp;&nbsp;{{ item.comment }}<br/></div>
          <el-divider />
        </div>
    </div>




  </div>
</template>

<style scoped>

</style>