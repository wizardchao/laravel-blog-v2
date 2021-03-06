import React, { Component } from 'react';
import { Icon, Form, Input, Button, Upload, message, Modal, Badge } from 'antd';
const FormItem = Form.Item;
const { TextArea } = Input;
import BraftEditor from 'braft-editor'
import 'braft-editor/dist/braft.css'
import styles from "./ArticleForm.css"

class CoverUploader extends React.Component {
  render() {
    const props = {
      action: 'z/upload',
      listType: 'picture',
      defaultFileList: [...this.props.coverList],
      headers:{
        'X-CSRF-TOKEN':document.head.querySelector('meta[name="csrf-token"]').content
      }
    };
    return (
      <div>
        <Upload {...props} onChange={this.props.coverChanged}>
          <Button>
            <Icon type="upload" /> 点此上传
          </Button>
        </Upload>
      </div>
    )
  }
}

export class ArticleForm extends React.Component {
  constructor(props) {
    super();
    this.state = {
      //封面文件列表缓存
      coverList:[],
      //表单
      title: props.article ? props.article.title : '',
      cover: props.article ? props.article.cover : '',
      content: props.article ? props.article.content : '',
      //分享Modal
      share_content: props.article ? props.article.content : '',
      share_type: 'html',
      shareContentModalvisible: false
    };
  }
  componentWillReceiveProps(nextProps) {
      this.setState({
        title: nextProps.article.title,
        cover: nextProps.article.cover,
        content: nextProps.article.content,
        share_content: nextProps.article.content,
      });
  }
  handelTitleChange = (e) => {
    let title = this.refs.title.input.value
    this.setState({title: title})
  }
  handleHTMLChange = (html) => {
    console.log(html);
    this.setState({
      content: html,
      share_content:html
    })
  }
  uploadFn = (param) => {
    const serverURL = 'z/upload'
    const xhr = new XMLHttpRequest
    const fd = new FormData()
    // libraryId可用于通过mediaLibrary示例来操作对应的媒体内容
    console.log(param.libraryId)
    const successFn = (response) => {
      // 假设服务端直接返回文件上传后的地址
      // 上传成功后调用param.success并传入上传后的文件地址
      param.success({
        url: JSON.parse(xhr.responseText).ObjectURL
      })
    }
    const progressFn = (event) => {
      // 上传进度发生变化时调用param.progress
      param.progress(event.loaded / event.total * 100)
    }
    const errorFn = (response) => {
      // 上传发生错误时调用param.error
      param.error({
        msg: 'unable to upload.'
      })
    }
    xhr.upload.addEventListener("progress", progressFn, false)
    xhr.addEventListener("load", successFn, false)
    xhr.addEventListener("error", errorFn, false)
    xhr.addEventListener("abort", errorFn, false)

    fd.append('file', param.file)
    xhr.open('POST', serverURL, true)
    xhr.setRequestHeader('X-CSRF-TOKEN', document.head.querySelector('meta[name="csrf-token"]').content);
    xhr.send(fd)
  }
  coverChanged(event) {
    if (event.file.response) {
      this.setState({
        coverList:event.fileList,
        cover:event.file.response.ObjectURL
      })
    }
  }
  shareContent() {
    var that = this
    if (this.state.share_type == 'markdown') {
      this.setState({
        share_content:this.state.content,
        share_type:'html'
      })
    }else {
      //html 转 markdown
      axios.post('z/articles/markdown', {
        content:this.state.content,
      })
      .then(function (response) {
        console.log(response);
        that.setState({
          share_content: response.data,
          share_type: 'markdown'
        })
      })
      .catch(function (error) {
        console.log(error);
      });
    }
  }
  showShareContentModal = () => {
    this.setState({
      shareContentModalvisible: true,
    });
  }
  handleShareContentCancel = (e) => {
    this.setState({shareContentModalvisible: false});
  }
  handleSubmit = (e) => {
    var that = this
    e.preventDefault();
    let title = this.state.title
    let cover = this.state.cover
    let content = this.state.content
    if (title == '') {
      message.error('标题不能为空');
    }else {
      //创建文章
      axios.post('z/articles', {
        title:title,
        cover:cover,
        content:content,
      })
      .then(function (response) {
        console.log(response);
        if (response.status == 200) {
          message.success(response.data.message)
          location.replace('#/articles')
        }
      })
      .catch(function (error) {
        console.log(error);
      });
    }
  }
  render() {
    const formItemLayout = {
      wrapperCol: {
        sm:{ span:24 },
        md:{ span:24 },
        lg:{ span: 20, offset: 2 }
      },
    };
    const editorProps = {
      height: 350,
      contentFormat:'html',
      initialContent: this.state.content,
      onHTMLChange: this.handleHTMLChange,
      media:{
        uploadFn:this.uploadFn
      },
      controls:[
        'undo', 'redo', 'split', 'font-size', 'font-family', 'text-color',
        'bold', 'italic', 'underline', 'strike-through', 'emoji', 'superscript',
        'subscript', 'text-align', 'split', 'headings', 'list_ul', 'list_ol',
        'blockquote', 'code', 'split', 'link', 'split', 'media'
      ],
      extendControls: [{
          type: 'split'
        },{
          type: 'modal',
          text: '封面',
          title: '更新封面图片',
          onClick: () => console.log(4),
          modal: {
            title: '上传文章封面图片',
            showClose: true,
            showCancel: false,
            showConfirm: false,
            children: (
              <div style={{width: 480, height: 160, padding: 20}}>
                <CoverUploader coverList={this.state.coverList} coverChanged={this.coverChanged.bind(this)} />
              </div>
            )
          }
        },{
          type: 'button',
          text: (<Icon type="share-alt" />),
          title: '导出 Html 或 Markdown 格式内容',
          onClick: () => {
            this.showShareContentModal()
          }
        }]
    };
    return (
      <Form>
        <FormItem
          {...formItemLayout}>
          <Input
            prefix={<Icon type="info-circle-o" />}
            placeholder="输入文章标题"
            ref="title"
            value={this.state.title}
            onChange={this.handelTitleChange} />
        </FormItem>
        <FormItem {...formItemLayout}>
          <div  style={{ borderRadius: 5, boxShadow: 'inset 0 0 0 0.5px rgba(0, 0, 0, 0.3), 0 10px 20px rgba(0, 0, 0, 0.1)'}}>
            <BraftEditor {...editorProps}/>
            <Modal
              title="导出 Html 或 Markdown 格式内容"
              visible={this.state.shareContentModalvisible}
              onCancel={this.handleShareContentCancel}
              footer={null}
            >
              <TextArea autosize={{ minRows: 2, maxRows: 6 }} value={this.state.share_content} style={{marginBottom:10}} />
              <div>
                <Badge status="success" text={this.state.share_type} />
                <Button type="primary" onClick={this.shareContent.bind(this)} icon="swap" style={{float:'right'}}>转换</Button>
              </div>
            </Modal>
          </div>
        </FormItem>
        <FormItem {...formItemLayout} style={{textAlign:'right'}}>
          <Button
            onClick={this.props.handleSubmit.bind(this, {
              title:this.state.title,
              cover:this.state.cover,
              content:this.state.content
            })}
            type="primary"
            htmlType="submit"
            icon="form"> 保存
          </Button>
        </FormItem>
      </Form>
    )
  }
}
