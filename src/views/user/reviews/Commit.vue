<script>
import axios from "axios";
import Cookies from "js-cookie";
import getIdenticon from "@/utils/identicon";
import { PrismEditor } from "vue-prism-editor";
import "vue-prism-editor/dist/prismeditor.min.css"; // import the styles somewhere
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-tomorrow.css"; // import syntax highlighting styles
import parseDiff from 'parse-diff'
import {CodeDiff} from 'v-code-diff'
// import parseDiff from 'parse-diff'
import {defineComponent} from 'vue'
// import {CodeDiff} from 'v-code-diff'
export default {
  components: {
    PrismEditor,
    CodeDiff
  },
  inject: {
    user: {default: null},
    getCommitDetailBusy: {default: true},
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
      console.log("commitMessage:" + this.$route.query.commit.hash)
      axios.post("/api/develop/getCommitDetails", {
        userId: this.user.id,
        projectId: this.projId,
        repoId: this.repoId,
        sha: this.commitMessage.hash,
        branch: this.branchName
      })
          .then((response) => {
            console.log(response.data)
            if (response.data.errcode !== 0) {
              console.log("error in getting commit details")
              alert("请检查账号的Token是否已绑定及绑定的Token是否正确")
              this.$router.go(-1)
            } else {
              this.commitDetails = response.data.commit
              this.reviewer = this.commitDetails.reviewerName
              console.log(this.reviewer)
              console.log(this.commitDetails)
              this.comments = this.commitDetails.comments
              this.fileChanges = this.commitDetails.files
            }
          })

      axios.post("/api/develop/isProjectReviewer", {
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
              this.isProjectReviewer = response.data.flag
            }
          })
      this.getCommitDetailBusy = false
    },
    data() {
      return {
        lineNumbers: true,
        readonlyType:true,
        commitMessage: '',
        branchName: '',
        projId: '',
        repoId: '',
        commitDetails: '',
        comments: [{}],
        textarea: '',
        isProjectReviewer: 0,
        managerId: '',
        times: '',
        fileChanges: [],
        highlightLines: [],
        highlight: [],
        files: [],
        oldFile: '',
        newFile: '',
        fileDiff: [],
        reviewer: '',
        role: [],
      }
    },
  methods: {
    getTimes() {
      let year = new Date().getFullYear(); //获取当前时间的年份
       let month = new Date().getMonth() + 1; //获取当前时间的月份
       let day = new Date().getDate(); //获取当前时间的天数
       let hours = new Date().getHours(); //获取当前时间的小时
       let minutes = new Date().getMinutes(); //获取当前时间的分数
       let seconds = new Date().getSeconds(); //获取当前时间的秒数
       //当小于 10 的是时候，在前面加 0
       if (hours < 10) {
         hours = "0" + hours;
       }
       if (minutes < 10) {
         minutes = "0" + minutes;
       }
       if (seconds < 10) {
         seconds = "0" + seconds;
       }
       //拼接格式化当前时间
       this.times = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
    },
    reviewCommit(result) {
      this.reviewer = this.user.name
      axios.post("/api/develop/modifyCommitStatus", {
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
            this.getTimes()
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
        axios.post("/api/develop/commentCommit", {
          userId: this.user.id,
          projectId: this.projId,
          repoId: this.repoId,
          comment: this.textarea,
          sha: this.commitMessage.hash
        })
            .then(() => {
              this.comments.push({
                commenterName: this.user.name,
                comment: this.textarea,
                commenterId: this.user.id,
                commenterRole: this.isProjectReviewer === 1 ? 'D' : 'C'
              })
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
      getColor1(role) {
        if (role === 'D') {
          return 'purple'
        } else if (role === 'C') {
          return 'blue'
        } else {
          return 'brown'
        }
      },
      transform1(role) {
        if (role === 'D') {
          return '审核人员'
        } else if (role === 'C') {
          return '负责人'
        } else {
          return '其他项目人员'
        }
      },
      getIdenticon,
  }
}
</script>

<template>
  <div v-if="getCommitDetailBusy" v-loading="getCommitDetailBusy"></div>
  <div style="margin: 15px" v-else>
    <el-page-header @back="goBack" content="commit评审" style="margin-top: 40px"></el-page-header>
    <h1 style="margin-top: 20px; margin-left: 20px">Commit</h1>
    <div style="margin-bottom: 10px; margin-left: 20px; display: inline-block">
      <v-chip :color="getColor(this.commitDetails.status)" dark v-if="this.getCommitDetailBusy === false">
        {{ transform(this.commitDetails.status) }}
      </v-chip>
      <v-chip  dark v-else>
        加载中
      </v-chip>
      <span style="margin-left: 20px; font-size: small; color: rgb(128,128,128)"
            v-if="this.commitDetails.status !== null">
        由 {{this.reviewer}} 完成审核
      </span>
    </div>
    <div>
      <v-divider style="margin-left: 20px"></v-divider>
    </div>
    <el-card style="margin-top: 15px; margin-bottom: 15px">
      <h3>{{commitMessage.message}}</h3>
      <div style="font-size:0.4cm; margin-top:10px; padding-bottom: 10px">branch: <b>{{this.branchName}}</b></div>
      <div></div>
      <v-divider style="margin-bottom: 15px"></v-divider>
      <b style="margin-top: 20px">{{this.commitMessage.committer}}</b> committed at {{this.commitMessage.time.slice(0,10) + " " + this.commitMessage.time.slice(11,-1)}}
      <div></div>
      <div style="display: inline-block; margin-top: 20px"
           v-if="this.isProjectReviewer !== 0 && this.commitDetails.status === null && this.getCommitDetailBusy === false">
        <v-chip :color="'green'" dark style="margin-right: 30px" @click="reviewCommit(1)">
        同意
      </v-chip>
      <v-chip :color="'red'" dark @click="reviewCommit(0)">
        拒绝
      </v-chip>
      </div>
    </el-card>
    <v-divider></v-divider>
<!--    <prism-editor-->
<!--        class="my-editor height-300"-->
<!--        v-model="test"-->
<!--        :highlight="highlighter"-->
<!--        :line-numbers="lineNumbers"-->
<!--        :readonly="readonlyType"-->
<!--    ></prism-editor>-->
    <template>
      <div v-for="item in fileChanges" :key="item.filename" style="white-space: pre;">
      <code-diff
      :old-string="item.prev_file"
      :new-string="item.now_file + '\n'"
      :context="3"
      :filename="item.filename"
      output-format="line-by-line"/></div>
    </template>
    <v-divider></v-divider>
    <div style="margin-top: 20px;">
      <div style="margin-bottom: 10px"><b>{{this.comments.length}}</b> comments on commit <v-chip label small>{{this.commitDetails.sha.slice(0, 6)}}</v-chip></div>

      <el-input
        type="textarea"
        :rows="4"
        placeholder="请输入评论内容"
        v-model="textarea"
      v-if="this.commitDetails.status === null && this.isProjectReviewer !== 0">
        </el-input>
      <el-input
        type="textarea"
        :rows="4"
        placeholder="审核已完成，不可评论"
        v-model="textarea"
        v-else-if="this.isProjectReviewer !== 0"
        disabled>
        </el-input>
      <el-input
        type="textarea"
        :rows="4"
        placeholder="您不是审核人员或项目负责人，无法评论"
        v-model="textarea"
        v-else
        disabled>
        </el-input>
       <el-button style="margin-top: 14px; margin-left: auto; justify-content: flex-end; display: flex; color: white" type="success" @click="submitComment()" dark v-if="this.commitDetails.status === null && this.isProjectReviewer !== 0">
         提交评论
       </el-button>
      <el-button style="margin-top: 14px; margin-left: auto; justify-content: flex-end; display: flex; color: white" type="success" @click="submitComment()" dark v-else disabled>
         提交评论
       </el-button>
      <div class="comment" v-for="item in comments" style="margin: 0 30px 0 30px">
        <span style="font-size: 0.7cm;"><strong>{{ item.commenterName }}</strong><v-chip style="margin-left: 10px" small dark :color="getColor1(item.commenterRole)">{{transform1(item.commenterRole)}}</v-chip></span>
          <div style="margin-top: 15px;">&nbsp;&nbsp;&nbsp;&nbsp;{{ item.comment }}<br/></div>
          <el-divider />
        </div>
    </div>




  </div>
</template>

<style scoped>
.my-editor {
 background: #2d2d2d;
 color: #ccc;

 font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
 font-size: 14px;
 line-height: 1.5;
 padding: 5px;
}

/* optional */
.prism-editor__textarea:focus {
 outline: none;
}

.code-diff-view {
  overflow: hidden;
}
</style>