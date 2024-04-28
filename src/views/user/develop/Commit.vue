<script>
import axios from "axios";
import Cookies from "js-cookie";
import getIdenticon from "@/utils/identicon";
import { PrismEditor } from "vue-prism-editor";
import "vue-prism-editor/dist/prismeditor.min.css"; // import the styles somewhere
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-tomorrow.css"; // import syntax highlighting styles
import parseDiff from 'parse-diff'
import {defineComponent} from 'vue'
import {CodeDiff} from 'v-code-diff'
export default {
  components: {
    PrismEditor,
    CodeDiff,
    parseDiff,
  },
  inject: {
    user: {default: null},
    getCommitDetailBusy: {default: true},
    comments: {default: null},
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
              this.fileChanges = response.data.commit.files
              console.log(this.commitDetails)
              console.log(this.fileChanges)
              for (let i = 0; i < this.fileChanges.length; i++) {
                const diff = this.fileChanges.at(i).patch
                const file = parseDiff(diff)
                let filename = this.fileChanges[i].filename
                this.files.push({filename: filename, details: file[0].chunks[0]})
                console.log(this.files)
              }
              for (let i = 0; i < this.files.length; i++) {
                const length = this.files[i].details.changes.length
                let lineCounter = 1
                for (let j = 0; j < length; j++) {
                  while (lineCounter < this.files[i].details.changes[j].ln1) {
                    this.oldFile += '\n'
                    this.newFile += '\n'
                    lineCounter++
                  }
                  lineCounter += 2
                  if (this.files[i].details.changes[j].type === 'normal') {
                    this.oldFile += this.files[i].details.changes[j].content + '\n'
                    this.newFile += this.files[i].details.changes[j].content + '\n'
                  } else if (this.files[i].details.changes[j].type === 'del') {
                    this.oldFile += this.files[i].details.changes[j].content.slice(1) + '\n'
                  } else if (this.files[i].details.changes[j].type === 'add' && this.files[i].details.changes[j].content.slice(1) !==  " No newline at end of file") {
                    this.newFile += this.files[i].details.changes[j].content.slice(1) + '\n'
                  }
                }
                this.fileDiff.push({filename: this.files[i].filename, diff: {old: this.oldFile, new: this.newFile}})
                this.oldFile = ''
                this.newFile = ''
              }
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
        lineNumbers: true,
        readonlyType:true,
        commitMessage: '',
        branchName: '',
        projId: '',
        repoId: '',
        commitDetails: '',
        textarea: '',
        isProjectReviewer: false,
        managerId: '',
        times: '',
        fileChanges: [],
        highlightLines: [],
        highlight: [],
        files: [],
        oldFile: '',
        newFile: '',
        fileDiff: []

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
      getColor1(role) {
        if (role === 'D') {
          return 'purple'
        } else {
          return 'blue'
        }
      },
      transform1(role) {
        if (role === 'D') {
          return '审核人员'
        } else {
          return '负责人'
        }
      },
      getIdenticon,
      highlighter(code) {
        return highlight(code, languages.js);
      }
  }
}
</script>

<template>
  <div style="margin: 15px">
    <el-page-header @back="goBack" content="评审" style="margin-top: 40px"></el-page-header>
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
        由 {{this.commitDetails.reviewerName}} 完成审核
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
      <b style="margin-top: 20px">{{this.commitMessage.committer}}</b> committed at {{this.commitMessage.time.slice(4,-5)}}
      <div></div>
      <div style="display: inline-block; margin-top: 20px"
           v-if="this.isProjectReviewer === true && this.commitDetails.status === null && this.getCommitDetailBusy === false">
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
      <div v-for="item in fileDiff" :key="item.filename" style="white-space: pre;">
      <code-diff
      :old-string="item.diff.old"
      :new-string="item.diff.new"
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
        placeholder="您不是审核人员或项目负责人，无法评论"
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