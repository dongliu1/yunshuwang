<?php
/**
 * Created by PhpStorm.
 * User: liudong
 * Date: 2016/11/17
 * Time: 16:35
 */
$con=mysqli_connect("localhost","root","dqTKqNta2dJTF7EU","db_ysw");
// 检测连接
$account=$_POST["account"];
if (mysqli_connect_errno())
{
    die("连接失败: " . mysqli_connect_error());
}
$reJson="";
$sql="UPDATE ysw_account SET usertype=2 WHERE account='".$account."'";
if(mysqli_query($con,$sql)){
    echo "True";
}else{
    echo 'False';
};

mysqli_close($con);
?>