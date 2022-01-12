@Library('CoreLogicDevopsUtils')
@Library('CoreLogicPipelineUtils')
@Library('CoreLogicOrgPipelineConfig')

import com.corelogic.devops.utils.PodTemplates

slaveTemplates = new PodTemplates()

/*
************************************
Parameters Required for Pod Template
************************************
*/
// Container name referencing docker image
def containerName = "nodejs"
// Node Name (pod gets created under this name)
def label = "discovery-center-us-idcservices-${containerName}"
// Application based docker image from GCR
def applicationImage = "us.gcr.io/clgx-jenkins-glb-prd-8ea3/discovery-center-us/idcservices/${containerName}"

def appName = "dc_dialogflow_webhook_fulfillment"
def branchName = env.BRANCH_NAME
println "We're at the branch $branchName"
if (branchName == "FrameworkDevelopment") {
    appName = 'dc_dialogflow_webhook_fulfillment_framework'
}

/*
************
CREATING POD
************
*/
slaveTemplates.getPodTemplate(label, containerName, applicationImage) {
    node(label) {
        container(containerName) {
            // At this stage, a pod with container is provisioned and is ready to execute the tasks
            def pipeline = pipelineManager.config()
            def buildType = new com.corelogic.pipeline.DeployableType(
                   appName: appName,
                   ecosystemName: 'idcservices',
                   deployCloudFunction: true,
                   developPipelineFlow: 'Cloud_Functions',
                   pipelineFlowName: 'Cloud_Functions',
                   deployToCF: false,
                   builder: new com.corelogic.builder.NodeJSAppBuilder(buildCommand: 'run ci_build')
            )
            pipeline.execute(buildType)
        }
    }
}
