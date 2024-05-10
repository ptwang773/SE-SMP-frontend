<template>
    <v-app>
        <v-container>
            <v-row>
                <h1>请求进行代码评审 - {{ selectedProj.projectName }}</h1>
            </v-row>
            <v-row>
                <h2>代码仓库：</h2>
            </v-row>
            <v-row>
                <el-select v-model="curRepoId" placeholder="请选择">
                    <el-option v-for="item in repos" :key="item.value" :label="item.label" :value="item.value">
                    </el-option>
                </el-select>
            </v-row>
            <v-row>
                <v-col cols="5">
                    <v-row>
                        <h3>源分支：</h3>
                    </v-row>
                    <v-row>
                        <el-select v-model="srcBranch" placeholder="请选择">
                            <el-option v-for="item in branches" :key="item.value" :label="item.label" :value="item.value">
                            </el-option>
                        </el-select>
                    </v-row>
                </v-col>
                <v-col cols="5">
                    <v-row>
                        <h3>目标分支：</h3>
                    </v-row>
                    <v-row>
                        <el-select v-model="dstBranch" placeholder="请选择">
                            <el-option v-for="item in  branches" :key="item.value" :label="item.label" :value="item.value">
                            </el-option>
                        </el-select>
                    </v-row>
                </v-col>
            </v-row>
            <v-row>
                <v-col cols="7"><el-input v-model="title" placeholder="请输入标题"></el-input></v-col>

            </v-row>
            <v-row>
                <div class="editor">
                    <mavon-editor v-model="html" ref="md" style="min-height: 600px" />
                </div>
            </v-row>
            <v-row>
                <el-button type="primary" @click="handle_submit">新建</el-button>
                <el-button type="primary" @click="handle_cancel">取消</el-button>
            </v-row>
        </v-container>
    </v-app>
</template>
    
    
<script>
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css';
import topicSetting from "@/utils/topic-setting";
import axios from 'axios';
import { mavonEditor } from "mavon-editor";
import "mavon-editor/dist/css/index.css";
export default {
    created() {
        if (this.selectedProj !== null)
            this.updateBindRepos();
        this.userId = this.user.id;
        this.projectId = this.selectedProj.projectId;
    },
    inject: {
        user: { default: null },
        selectedProj: { default: null },
        changeSelectedProj: { default: null }
    },
    // provide() {
    //     return {
    //         proj: computed(() => {
    //             return {
    //                 id: this.selectedProj.projectId,
    //                 name: this.selectedProj.projectName,
    //                 intro: this.selectedProj.projectIntro
    //             }
    //         }),
    //         bindRepos: computed(() => this.bindRepos),
    //         bindReposBusy: computed(() => this.bindReposBusy),
    //         updateBindRepos: this.updateBindRepos,
    //     }
    // },
    // async created() {
    //     var _this = this;
    //     this.editorConfig.MENU_CONF['uploadImage'] = {
    //         server: '',
    //         async customUpload(file, insertFn) {
    //             const formData = new FormData();
    //             formData.append('file', file);
    //             await _this.$axios({
    //                 method: 'post',
    //                 url: 'upload_file/',
    //                 data: formData
    //             }).then(async (res) => {
    //                 if (res.data.status != 200) {
    //                     let _msg = _this.$message.error({
    //                                     labels: 'error',
    //                                     message: String(res.data.msg)
    //                                 });
    //                 } else {
    //                     let _msg = _this.$message.success({
    //                                     labels: 'success',
    //                                     message: "上传成功！"
    //                                 });
    //                     insertFn(res.data.data.url, '图片' + String(res.data.data.id), '');
    //                 }
    //             })
    //         }
    //     }
    // },

    components: { Editor, Toolbar },
    data() {
        return {
            curRepoId: undefined,
            curRepoName: undefined,
            branches: [],
            bindRepos: [],
            repos: [],
            bindReposBusy: true,
            userId: '',
            projId: undefined,
            repoId: undefined,
            srcBranch: '',
            dstBranch: '',
            editor: null,
            title: '',
            html: '',
            image: null,
            image_id: null,
            toolbarConfig: {},
            editorConfig: {
                placeholder: '请输入内容...',
                MENU_CONF: {
                    uploadImage: null,
                }
            },
            mode: 'default', // or 'simple'
        }
    },
    methods: {
        onCreated(editor) {
            this.editor = Object.seal(editor) // 一定要用 Object.seal() ，否则会报错
        },


        handle_submit() {
            console.log(this.html)
            if (
                this.title && this.title.length > 0 &&
                this.html && this.html.length > 0
            ) {
                if (this.srcBranch === this.dstBranch) {
                    this.$message.error({
                        labels: 'error',
                        message: '源分支与目标分支不能相同'
                    });
                } else if (!this.srcBranch) {
                    this.$message.error({
                        labels: 'error',
                        message: '请选择源分支'
                    });
                } else if (!this.dstBranch) {
                    this.$message.error({
                        labels: 'error',
                        message: '请选择目标分支'
                    });
                }
                axios.post('/api/develop/gitPr', {

                    userId: this.userId,
                    projectId: this.projectId,
                    repoId: this.curRepoId,
                    branch: this.srcBranch,
                    title: this.title,
                    body: this.html,
                    base: this.dstBranch
                }).then( (res) => {
                    if (res.data.errcode === 0) {
                        this.$message.success({
                            labels: 'success',
                            message: '成功提交PR'
                        });
                    } else {
                        alert('/api/develop/gitPr error with not 0 err code (' + res.data.errcode + ') ' + res.data.message)
                    }
                })
            } else {
                this.$message.error({
                    labels: 'error',
                    message: '请填写标题和内容！'
                });
            }

        },
        handle_cancel() {
            this.title = '';
            this.html = '';
        },
        modifyUser() {
            alert('not implemented!')
        },
        updateBindRepos() {
            this.bindReposBusy = true;
            axios.post('/api/develop/getBindRepos', {
                userId: this.user.id,
                projectId: this.selectedProj.projectId
            }).then((res) => {
                if (res.data.errcode === 0) {
                    this.bindRepos = res.data.data.map((cur, index, arr) => {
                        let remotePath = cur.repoRemotePath;
                        remotePath = remotePath.split('/')
                        return {
                            id: cur.repoId,
                            user: remotePath[0],
                            repo: remotePath[1],
                            intro: cur.repoIntroduction
                        }
                    })
                    this.bindReposBusy = false;
                    for (var i = 0; i < this.bindRepos.length; i++) {
                        var newRepo = { value: this.bindRepos[i].id, label: this.bindRepos[i].repo };
                        this.repos.push(newRepo);
                    }
                    this.curRepoId = this.bindRepos[0].id;
                    this.curRepoName = this.bindRepos[0].repo;
                } else {
                    this.bindReposBusy = false;
                    alert('/api/develop/getBindRepos error with not 0 err code (' + res.data.errcode + ') ' + res.data.message)
                }
            }).catch((err) => {
                alert('/api/develop/getBindRepos error' + err)
                this.bindReposBusy = false;
            })


        },

        updateBranch() {
            this.branches = [];
            axios.post('/api/develop/getRepoBranches', {
                userId: this.user.id,
                projectId: this.selectedProj.projectId,
                repoId: this.curRepoId
            }).then((res) => {
                if (res.data.errcode === 0) {
                    var branch = res.data.data;
                    console.log('ggggggggggggggggggggggggg');
                    console.log(branch);
                    for (var i = 0; i < branch.length; i++) {
                        var newBranch = { label: branch[i].branchName, value: branch[i].branchName };
                        this.branches.push(newBranch);
                    }
                    console.log('hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh');
                    console.log(this.branches);
                } else {
                    this.bindReposBusy = false;
                    alert('/api/develop/getBindRepos error with not 0 err code (' + res.data.errcode + ') ' + res.data.message)
                }
            }).catch((err) => {
                alert('/api/develop/getBindRepos error' + err)
            })
        },
        // projSelected(proj) {
        //     console.log(JSON.stringify(this.selectedProj) + '<-' + JSON.stringify(proj));
        //     this.selectedProj = proj;
        //     console.log(JSON.stringify(this.selectedProj));
        // },
        getTopicColor: topicSetting.getColor,
        getRadialGradient: topicSetting.getRadialGradient,

    },
    beforeDestroy() {
        const editor = this.editor
        if (editor == null) return
        editor.destroy() // 组件销毁时，及时销毁编辑器
    },
    watch: {
        curRepoId() {

            this.updateBranch();
        }
    }
}
</script>
    
    
<style scoped>
.base {
    margin: 30px;
}

.title {
    display: flex;
    flex-direction: row;
    margin: 10px;
}

.el-input {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.editor {
    border: 2px solid #ccc;
    margin: 10px;
    border-radius: 5px;
    text-align: left;
}

.left-align-form .el-form-item {
    text-align: left;
}

.image-center-content {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.avatar-uploader .el-upload:hover {
    border-color: #409EFF;
}

.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 200px;
    height: 150px;
    line-height: 150px;
    text-align: center;
}

.avatar {
    width: 200px;
    height: 150px;
    display: block;
}
</style>
    