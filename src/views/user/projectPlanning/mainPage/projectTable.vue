<template>
  <div>
    <div class="header">
      <h2 style="display: inline-block; margin-right: 10px;">项目表</h2>
      <el-button type="primary" @click="">创建项目</el-button>
    </div>
    <el-table :data="user.projects" style="width: 100%">
      <el-table-column prop="projectName" label="项目">
        <template v-slot="scope">
          <a @click="" style="position:relative;left:5%;">{{ scope.row.projectName }}</a>
        </template>
      </el-table-column>
      <el-table-column width="300">
        <template v-slot:header>
          <div class="header-btns">
            <el-button type="success" @click="">绑定仓库</el-button>
          </div>
        </template>
        <template v-slot="scope">
          <el-table
              :data="projects[scope.row.projectId]"
              style="width: 100%"
              :show-header="false"
          >

            <el-table-column prop="repoRemotePath">
              <template v-slot="scope">
                <a :href="'https://github.com/' + scope.row.repoRemotePath">{{ scope.row.repoRemotePath }}</a>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script>

import axios from "axios";
import Cookies from "js-cookie";

export default {
  name: "projectTable.vue",

  inject: {
    user: {default: null},
    projectData: {default: null},
  },
  created() {
    this.updateRepo();
  },
  data() {
    return {
      projects: {},
    }
  },
  methods: {
    getProj(project) {
      console.log("aaaa", project)
      if (project) {
        let manager = Cookies.get("manager")
        if (project.access === "B" && manager === undefined) { // 项目禁用，且不是管理员跳转
          this.$message({
            type: 'error',
            message: "该项目已被禁用"
          });
        } else {
          Cookies.set("proj", JSON.stringify(project));
          window.location.href = "/allTask";
        }
        // this.proj = Cookies.get(proj);
      }
    },
    updateRepo() {
      if (this.user !== undefined) {
        let project;
        for (project of this.user.projects) {
          axios
              .post("/api/develop/getBindRepos", {
                userId: this.user.id,
                projectId: project.projectId,
              })
              .then((res) => {
                if (res.data.errcode === 0) {
                  const bindReposArray = res.data.data.map(repo => ({
                    repoId: repo.repoId,
                    repoRemotePath: repo.repoRemotePath,
                    name: repo.name,
                    repoIntroduction: repo.repoIntroduction
                  }));
                  // console.log(this.projectData)
                  this.$set(this.projects, this.projectData, bindReposArray);
                  Cookies.set("user", JSON.stringify(this.user));
                } else {
                  alert(
                      "updateUserProj failure! with non 0 errcode " + res.data.errcode
                  );
                }
              })
              .catch((err) => {
                alert("updateUserProj failure! with error " + err);
              });
        }
      }
    }
  }
  ,


}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
}

.header-btns {
  display: flex;
  justify-content: flex-end;
}
</style>