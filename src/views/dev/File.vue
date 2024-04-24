<script>
import axios from "axios";
import Cookies from 'js-cookie'
import * as CodeMirror from 'codemirror/lib/codemirror.js'
import "@/utils/cm-settings.js"
import topicSetting from "@/utils/topic-setting";
import {downloadStrAsFile} from "@/utils/file-system";

export default {
    name: "FileView",
    data() {
        return {
          tree:[],
            files: {
                html: 'mdi-language-html5',
                js: 'mdi-nodejs',
                json: 'mdi-code-json',
                md: 'mdi-language-markdown',
                pdf: 'mdi-file-pdf',
                png: 'mdi-file-image',
                txt: 'mdi-file-document-outline',
                xls: 'mdi-file-excel',
                vue: 'mdi-vuejs'
            },
            items: [],
            cmEditor: null,
            sheet: false,
            fileContent: '选择一个文件以查看其内容\n\n选择文件后，可以点击右上角”代码助手“，使用JiHub进行AI代码诊断、生成单元测试、下载文件',
            selectedText: '',
            fileTreeReady: false,
            fileContentReady: false,

            
            curFilePath:'',
            curFileName:'',
            nextFilePath:'',
            filePathList:[],
            commitVisible:false,
            treeDisable:false,
            commitForm:{
              title:'提交到 ' + this.branchName + ' 分支' ,
              commitMessage:'',
            newBranch: '',
            isNewBranch:false,
            editList:[],
            }

        }
    },
    inject: {
        user: {default: null},
        proj: {default: null},
        repo: {default: null},
        branchName: {default: null}
    },
    methods: {
        downloadStrAsFile,
        getFileExt(obj, path) {
            if (obj['children'] === undefined) {
                obj['file'] = 'unknown'
                obj['path'] = path + '/' + obj['name']
                if (obj['name'].indexOf('.') !== -1) {
                    obj['file'] = obj['name'].split('.').pop()
                }
            } else {
                for (let i = 0; i < obj['children'].length; i++) {
                    this.getFileExt(obj['children'][i], path + '/' + obj['name'])
                }
            }
        },
        file2style() {
          if (this.tree.length === 0) {
            return 'null'
          }

          let file = this.tree[0]['file']
          if (file === 'html') {
            return 'htmlmixed'
          } else if (file === 'js') {
            return 'javascript'
          } else if (file === 'json') {
            return 'javascript'
          } else if (file === 'md') {
            return 'markdown'
          } else if (file === 'vue') {
            return 'vue'
          } else if (file === 'css') {
            return 'css'
          } else if (file === 'xml') {
            return 'xml'
          } else if (file === 'c' || file === 'cpp' || file === 'h') {
            return 'clike'
          } else if (file === 'py') {
            return 'python'
          } else {
            return 'null'
          }
        },
        onCursorActivity() {
          this.selectedText = this.cmEditor.getSelection()
        },
        diagSelected() {
          //如果文件长度大于Cookie最长长度，就不诊断了
          if (this.selectedText.length > 4096) {
            this.$message({
              type: 'error',
              message: '文件太长了，AI会罢工的！'
            })
            return
          }
          if (this.selectedText.length <= 10) {
            this.$message({
              type: 'error',
              message: '代码这么短，怎么诊断嘛'
            })
            return
          }
          Cookies.set('diag', this.selectedText)
          window.open('/user/ai/diagnosis', '_blank')
        },
        diagWholeFile() {
          //如果文件长度大于Cookie最长长度，就不诊断了
          if (this.fileContent.length > 4096) {
            this.$message({
              type: 'error',
              message: '文件太长了，AI会罢工的！'
            })
            return
          }
          Cookies.set('diag', this.fileContent)
          window.open('/user/ai/diagnosis', '_blank')
        },
        unitTestSelected() {
          //如果文件长度大于Cookie最长长度，就不诊断了
          if (this.selectedText.length > 4096) {
            this.$message({
              type: 'error',
              message: '文件太长了，AI会罢工的！'
            })
            return
          }
          if (this.selectedText.length <= 10) {
            this.$message({
              type: 'error',
              message: '代码这么短，怎么生成嘛'
            })
            return
          }
          Cookies.set('diag', this.selectedText)
          window.open('/user/ai/testdata', '_blank')
        },
        unitTestWholeFile() {
          //如果文件长度大于Cookie最长长度，就不诊断了
          if (this.fileContent.length > 4096) {
            this.$message({
              type: 'error',
              message: '文件太长了，AI会罢工的！'
            })
            return
          }
          Cookies.set('diag', this.fileContent)
          window.open('/user/ai/testdata', '_blank')
        },

        tabClick() {
          if(this.nextFilePath == this.curFilePath) {
            return;
          }
          for(var i = 0; i < this.filePathList.length; i++) {
              if(this.filePathList[i].path == this.curFilePath){
                if(this.filePathList[i].content != this.cmEditor.getValue()) {
                  this.filePathList[i].newContent = this.cmEditor.getValue();
                  this.filePathList[i].changed = true;
                }else {
                  this.filePathList[i].changed = false;
                }
              }
            }
            for(var i = 0; i < this.filePathList.length; i++) {
              if(this.filePathList[i].path == this.nextFilePath){
                this.curFilePath = this.filePathList[i].path;
                this.fileContent = this.filePathList[i].changed ? this.filePathList[i].newContent : this.filePathList[i].content;
                this.cmEditor.setValue(this.fileContent);
                this.cmEditor.setOption('mode', this.file2style());
              }
            }
        },
        tabRemove() {
          for(var i = 0; i < this.filePathList.length; i++) {
              if(this.filePathList[i].path == this.nextFilePath){
                if(this.filePathList[i].content != this.cmEditor.getValue()) {
                  this.commitVisible = true;
                  return;
                } else {
                  this.filePathList.splice(i, 1);
                }
              }
            }
          if(this.filePathList.length == 0){
            this.curFilePath = '';
            this.fileContent = '选择一个文件以查看其内容\n\n选择文件后，可以点击右上角”代码助手“，使用JiHub进行AI代码诊断、生成单元测试、下载文件';
            this.cmEditor.setOption('mode', '');
          }else {
            var now = this.filePathList.length - 1;
            this.fileContent = this.filePathList[now].changed ? this.filePathList[now].newContent : this.filePathList[now].content;
            this.curFilePath = this.filePathList[now].path;
            this.nextFilePath = this.curFilePath;
            this.cmEditor.setValue(this.fileContent);
            this.cmEditor.setOption('mode', this.file2style());
          }
        },
        openForm() {
          for(var i = 0; i < this.filePathList.length; i++) {
            if(this.filePathList[i].path == this.curFilePath) {
              if(this.cmEditor.getValue() != this.filePathList[i].content){
                this.filePathList[i].changed = true;
                this.filePathList[i].newContent = this.cmEditor.getValue();
              }
            }
            if(this.filePathList[i].changed == true) {
              var editFile = {path: this.filePathList[i].path, content: this.filePathList[i].newContent, isCommit: true};
              this.commitForm.editList.push(editFile);
            }
          }
          this.commitVisible = true;
        },
        cancelEdit() {
          for(var i = 0; i < this.filePathList.length; i++) {
            if(this.filePathList[i].changed == true) {
              this.filePathList[i].changed = false;
              this.tabClick();
            }
          }
        },
        submitForm() {
          var files = [];
          for(var i = 0; i < this.commitForm.editList.length; i++) {
            if(this.commitForm.editList[i].isCommit) {
              var file = {path:this.commitForm.editList[i].path.slice(1), content:this.commitForm.editList[i].content};
              files.push(file);
            }
          }
          if(files.length === 0) {
            this.$message({
              message: '请重新选择commit文件，当前未选中任何文件',
              type: 'warning'
          });
          return;
          }
          var api = this.submitForm.isNewBranch ? '/api/develop/gitBranch/' : '/api/develop/gitCommit'
          axios.post(api, {
            userId: this.user.id,
            projectId: this.proj.projectId,
            repoId: this.$route.params.repoid,
            branch: this.branchName,
            files:files,
            message:this.commitForm.commitMessage
        }).then((res) => {
            if (res.data.errcode !== 0) {
              alert('/api/develop/commit errcode not 0: ' + res.data.message)
            } else {
              for(var i = 0; i < this.commitForm.editList.length; i++) {
              for(var j = 0; j < this.filePathList.length; j++) {
                if(this.filePathList[j].path == this.commitForm.editList[i].path) {
                  this.filePathList[j].changed = false;
                  this.filePathList[j].content = this.filePathList[j].newContent;
                }
              }
            }
            }
        }).catch((err) => {
            alert('/api/develop/commit error' + err)
            console.log(err);
        }).finally(() => {
            this.commitVisible = false;
            this.commitForm.editList = [];
        })

        },
        getTopicColor: topicSetting.getDarkColor,
        getRadialGradient: topicSetting.getRadialGradient,
        getLinearGradient: topicSetting.getLinearGradient,
    },
    created() {
        this.fileTreeReady = false;
        axios.post('/api/develop/getFileTree', {
            userId: this.user.id,
            projectId: this.proj.projectId,
            repoId: this.$route.params.repoid,
            branch: this.branchName
        }).then((res) => {
            if (res.data.errcode === 0) {
                console.log(res.data.data)
                this.items = res.data.data             // [{file: ,   path: }]
                for (let i = 0; i < this.items.length; i++) {
                    this.getFileExt(this.items[i], '')
                }
                console.log("tree:\n");
                console.log(this.items);
            } else {
                alert('/api/develop/getFileTree errcode not 0: ' + res.data.message)
            }
        }).catch((err) => {
            alert('/api/develop/getFileTree error' + err)
            console.log(err);
        }).finally(() => {
            this.fileTreeReady = true;
        })
    },
    watch: {
        tree() {
            this.treeDisable = true;
            console.log('selected file change!')
            console.log(this.tree);
            if (this.tree[0]['file'] !== undefined) {
              if(this.curFilePath === this.tree[0]['path']) {
                this.treeDisable = false;
                return;
              }
              for(var i = 0; i < this.filePathList.length; i++) {
                  if(this.filePathList[i].path === this.curFilePath) {
                    if(this.filePathList[i].content !== this.cmEditor.getValue()) {
                    this.filePathList[i].newContent = this.cmEditor.getValue();
                    this.filePathList[i].changed = true;
                }else {
                  this.filePathList[i].changed = false;
                }
                  }
                }
                for(var i = 0; i < this.filePathList.length; i++) {
                  if(this.filePathList[i].path === this.tree[0]['path']) {
                    this.curFilePath = this.tree[0]['path'];
                    this.nextFilePath = this.tree[0]['path'];
                    this.curFileName = this.tree[0]['name'];
                    this.fileContent = this.fileContent = this.filePathList[i].changed ? this.filePathList[i].newContent : this.filePathList[i].content;
                    this.cmEditor.setValue(this.fileContent)
                    this.cmEditor.setOption('mode', this.file2style())
                    this.treeDisable = false;
                    return;
                  }
                }
                this.fileContentReady = false;
                this.cmEditor.setValue('正在努力拉取文件！\n\n选择文件后，可以点击右上角”代码助手“，使用JiHub进行AI代码诊断、生成单元测试、下载文件')
                this.cmEditor.setOption('mode', '')
                axios.post('/api/develop/getContent', {
                    userId: this.user.id,
                    projectId: this.proj.projectId,
                    repoId: this.$route.params.repoid,
                    branch: this.branchName,
                    path: this.tree[0]['path']
                }).then((res) => {
                    if (res.data.errcode === 0) {
                        console.log(res.data.data)
                        var newFile = {file:this.tree[0]['file'], path: this.tree[0]['path'], name: this.tree[0]['name'], content: this.fileContent = res.data.data, newContent: '', changed:false, removed:false};
                        this.filePathList.push(newFile);
                        this.curFilePath = newFile.path;
                        this.nextFilePath = this.curFilePath;
                        this.curFileName = newFile.name;
                        this.fileContent = newFile.content;
                        this.cmEditor.setValue(this.fileContent)
                        this.cmEditor.setOption('mode', this.file2style())
                    } else {
                        alert('/api/develop/getFileContent errcode not 0: ' + res.data.message)
                    }
                }).catch((err) => {
                    alert('/api/develop/getFileContent error' + err)
                    console.log(err);
                }).finally(() => {
                    this.fileContentReady = true;
                    this.treeDisable = false;
                })
            }
        }
    },
    mounted() {
      this.cmEditor = CodeMirror.fromTextArea(this.$refs.cm1, {
        theme: 'idea',
        lineNumbers: true,
        line: true,
        readOnly: false,
        lineWrapping: true
      });

      this.cmEditor.on('cursorActivity', this.onCursorActivity)
    }
}

</script>

<template>
  <v-container>
      <v-row>
          <!-- <v-col :cols="fileContentReady ? 2 : 3"> -->
            <v-col :cols=3>
              <div class="tabs-menu"><h2>文件树</h2></div>
              <v-card min-height="calc(100vh - 500px)" max-height="calc(100vh - 500px)" class="overflow-y-auto">
                <v-treeview
                    v-if="fileTreeReady"
                    :items="items"
                    :activatable="!treeDisable"
                    :active.sync="tree"
                    item-key="name"
                    open-on-click
                    dense
                    return-object
                >
                  <template v-slot:prepend="{ item, open }">
                    <v-icon v-if="!item.file" :color="getTopicColor(user.topic)">
                      {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
                    </v-icon>
                    <v-icon v-else :color="getTopicColor(user.topic)">
                      {{ files[item.file] !== undefined ? files[item.file] : 'mdi-file-document' }}
                    </v-icon>
                  </template>
                </v-treeview>
                <v-skeleton-loader
                    v-else
                    type="list-item-three-line@5"
                    class="mt-2"
                ></v-skeleton-loader>
              </v-card>
              <div class="commit-div">
                <div>
                  <el-button   size="medium" class="commit-button" @click="cancelEdit">取消修改</el-button>
                  <el-button type="primary" size="medium" @click="openForm" class="commit-button">创建提交</el-button>
                </div>
              </div>
              <el-dialog :title="commitForm.title" :visible.sync="commitVisible" width="40%">
                 <el-form :model="commitForm" ref="form" label-width="140px">
                  <el-form-item>
                    <el-checkbox v-for="item in commitForm.editList" :key="item.path" v-model="item.isCommit">{{ item.path }}</el-checkbox>
                  </el-form-item>
                  <el-form-item label="commit message">
                  <el-input v-model="commitForm.commitMessage"></el-input>
                </el-form-item>

                <el-form-item>
                    <el-checkbox v-model="commitForm.isNewBranch">是否提交到新分支</el-checkbox>
                </el-form-item>
                <el-form-item label="分支名称" v-if="commitForm.isNewBranch">
                  <el-input v-model="commitForm.newBranch"></el-input>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="submitForm">提交</el-button>
                </el-form-item>
                </el-form>
              </el-dialog>
          </v-col>
          <!-- <v-col :cols="fileContentReady ? 7 : 9"> -->
            <v-col :cols=9>
           <!--  <h2>
              <v-scroll-y-transition>
                <span>
                  {{
                    !fileTreeReady ? '文件树加载中，稍侯...' :
                        tree.length === 0 ? '请选择一个文件' :
                            !fileContentReady ? '正在努力拉取文件' : ''
                  }}
                </span>
              </v-scroll-y-transition>
              <v-scroll-y-transition>
                <a v-ripple
                   v-if="fileContentReady"
                   :style="'text-decoration: none; color: ' + getTopicColor(user.topic)"
                   :href="'https://github.com/' + repo.user + '/' + repo.repo + '/blob/' + branchName + '/' + tree[0]['path']"
                   target="_blank">
                  {{
                    !fileTreeReady ? '文件树加载中，稍侯...' :
                        tree.length === 0 ? '请选择一个文件' :
                            !fileContentReady ? '正在努力拉取文件' :
                                repo.repo + tree[0]['path']
                  }}
                </a>
              </v-scroll-y-transition>
            </h2> -->
            <div class="tabs-menu" v-show="filePathList.length">
                <el-tabs v-model="nextFilePath" type="card" @tab-click="tabClick" @tab-remove="tabRemove">
                <el-tab-pane v-for="item in filePathList" :key="item.path" :label="item.name" :name="item.path" :closable="true">
                <template #label>
                    <v-icon :color="getTopicColor(user.topic)">
                      {{ files[item.file] !== undefined ? files[item.file] : 'mdi-file-document' }}
                    </v-icon>
                    {{ item.name }}
                    <v-icon v-if="item.changed" color="black">mdi-circle-small</v-icon>
                </template>
                </el-tab-pane>
                </el-tabs>
            </div>
            <div v-show="filePathList.length === 0" style="height: 10%"></div>
              <v-card max-height="calc(100vh - 300px)" min-height="calc(100vh - 300px)">
                <textarea ref="cm1" v-model='fileContent' style="height: calc(100vh - 300px); width: 100%"></textarea>
              </v-card>
          </v-col>

         <!--  <v-col cols="3" v-if="fileContentReady">
            <h2 :style="'text-decoration: none; color: ' + getTopicColor(user.topic)">代码助手</h2>
            <v-card max-height="calc(100vh - 300px)" min-height="calc(100vh - 300px)" class="overflow-y-auto overflow-x-hidden">
              <v-card-title :style="getLinearGradient(user.topic)"><strong>欢迎来到代码助手</strong></v-card-title>
              <v-divider></v-divider>
              <v-card-title>单元测试</v-card-title>
              <v-card-text>JiHub可以对您选中的代码，或是整个文件生成单元测试</v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn width="" outlined :color="getTopicColor(user.topic)" @click="unitTestSelected"><v-icon>mdi-check</v-icon>对选中代码</v-btn>
              </v-card-actions>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn width="" outlined :color="getTopicColor(user.topic)" @click="unitTestWholeFile"><v-icon>mdi-check</v-icon>对整个文件</v-btn>
              </v-card-actions>
              <v-divider></v-divider>
              <v-card-title>代码诊断</v-card-title>
              <v-card-text>如果您阅读此代码比较困难，JiHub也很乐意对您选中的代码，或是整个文件进行代码诊断</v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn width="" outlined :color="getTopicColor(user.topic)" @click="diagSelected"><v-icon>mdi-code-braces</v-icon>对选中代码</v-btn>
              </v-card-actions>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn width="" outlined :color="getTopicColor(user.topic)" @click="diagWholeFile"><v-icon>mdi-code-braces</v-icon>对整个文件</v-btn>
              </v-card-actions>
              <v-divider></v-divider>
              <v-card-text>或者如果您想在GitHub操作，或查看源文件？</v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn width="" outlined :color="getTopicColor(user.topic)" link :href="'https://github.com/' + repo.user + '/' + repo.repo + '/blob/' + branchName + '/' + tree[0]['path']" target="_blank"><v-icon>mdi-github</v-icon>在GitHub浏览</v-btn>
              </v-card-actions>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn width="" outlined :color="getTopicColor(user.topic)" @click="() => downloadStrAsFile(selectedText, user.name + '\'s-clip' + '-' + this.tree[0]['name'])"><v-icon>mdi-download</v-icon>下载选中代码</v-btn>
              </v-card-actions>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn width="" outlined :color="getTopicColor(user.topic)" @click="() => downloadStrAsFile(fileContent, this.tree[0]['name'])"><v-icon>mdi-download</v-icon>下载整个文件</v-btn>
              </v-card-actions>

              <v-row style="height: 5rem"></v-row>
            </v-card>
          </v-col> -->
      </v-row>
  </v-container>

</template>

<style>
.CodeMirror {
  height: calc(100vh - 300px);
}

.need-mono {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
}
.tabs-menu {
    position: relative;
    width: 100%;
    height: 10%;
  }
.commit-div {
  margin-top: 100px;
  height: 150px;
  display: flex; 
  justify-content: center;
}
.commit-button {
    margin-right: 30px;
    margin-left: 30px;
  }
</style>